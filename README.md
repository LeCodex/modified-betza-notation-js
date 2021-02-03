# modified-betza-notation-js
A parser for the Modified Betza Notation used by the Compact Chess Interchange Format.

# What is this for?
This file is a parser of the Modified Betza Notation used by the Compact Chess Interchange Format to describe the momvements of chess pieces on the board. It is built upon the Funny Betza Notation, and adds many modifiers and syntaxes to allow the description of nearly any piece on the board.

## Examples
* The pieces in Orthodox Chess described in that notaion
    * P|Pawn|=mfW+cefF+[1-2]mefW02
    * N|Knight|=N
    * B|Bishop|=F0
    * R|Rook|=W0
    * Q|Queen|=R+B
    * K|King|=W+F

# How does it work?
The MDN function takes in a string representing the defintion of a single piece, and returns an Object that decomposes every part of the movement of that piece, in a (hopefully) easy-to-use manner.

In case the string contains a syntax error, the Object returned will contain an error property, which contains the reason of the error as a string. This means you can check for errors in the execution by simply doing `if (result.error)`.

## Notes
Normally, the MDN notation does not allow for whitespaces inside the definition. The MDN function currently does allow them, but only around the equal sign to improve readability.

This function has been made following Backus-Naur Form present at the end of this article: http://ccif.sourceforge.net/modified-betza-notation.html. However, this form is not complete and does not include all the elements of the MDN, and is even erroneous in some places. I have made some decisions regarding each defintion in that form that I have written in their respective functions as comments.

## Examples 
- The Pawn piece passed through the MDN function (with developBasicLeapers and developModifiers both true)
```js
Input: P|Pawn| = mfW+cefF+[1-2]mefW02
Output: {
  piece: 'P',
  sequence: [
    [
      {
        move: {
          modifiers: [ { modifier: 'move' }, { modifier: 'forward' } ],
          choices: [ { leap: [ 0, 1 ] } ]
        }
      },
      {
        move: {
          modifiers: [
            { modifier: 'capture' },
            { modifier: 'enPassant' },
            { modifier: 'forward' }
          ],
          choices: [ { leap: [ 1, 1 ] } ]
        }
      },
      {
        prefix: {
          range: [ { rank: [ '1', '2' ] } ]
        },
        move: {
          modifiers: [
            { modifier: 'move' },
            { modifier: 'enPassant' },
            { modifier: 'forward' }
          ],
          choices: [ { leap: [ 0, 1 ], steps: { exact: true, amount: '2' } } ]
        }
      }
    ]
  ]
}
```
- A fairy Bishop piece, that is circular on the b and g ranks (it can jump from the b to the g rank as if they were next to each other, but not from the a or h rank). This returns an error as, currently, modifiers (here 'o') cannot take in a BoardRange
```js
Input: B = o[b,g]B
Output: {
  piece: 'B',
  sequence: [ [] ],
  error: 'Could not match the PartialMove`o[b,g]B`'
}
```
- The Cannon, a particularly complex of Xiangqi, a Chinese version of chess, often used to represent and/or explain the concept of hopping (https://en.wikipedia.org/wiki/Xiangqi#Cannon)
```js
Input: a{^C}p{^C}R+[d-f1-3]a{^C}p{^C}B[d-f1-3]+[d-f8-10]a{^C}p{^C}B[d-f8-10]
Output: {
  piece: 'C',
  sequence: [
    [
      {
        move: {
          modifiers: [
            {
              modifier: 'all',
              pieceSet: { pieces: [ 'C' ], inverted: true }
            },
            {
              modifier: 'hop',
              pieceSet: { pieces: [ 'C' ], inverted: true }
            }
          ],
          choices: [ { leap: [ 0, 1 ], steps: { any: true } } ]
        }
      },
      {
        prefix: {
          range: [ { file: [ 'd', 'f' ], rank: [ '1', '3' ] } ]
        },
        move: {
          modifiers: [
            {
              modifier: 'all',
              pieceSet: { pieces: [ 'C' ], inverted: true }
            },
            {
              modifier: 'hop',
              pieceSet: { pieces: [ 'C' ], inverted: true }
            }
          ],
          choices: [ { leap: [ 1, 1 ], steps: { any: true } } ],
          range: [ { file: [ 'd', 'f' ], rank: [ '1', '3' ] } ]
        }
      },
      {
        prefix: {
          range: [ { file: [ 'd', 'f' ], rank: [ '8', '10' ] } ]
        },
        move: {
          modifiers: [
            {
              modifier: 'all',
              pieceSet: { pieces: [ 'C' ], inverted: true }
            },
            {
              modifier: 'hop',
              pieceSet: { pieces: [ 'C' ], inverted: true }
            }
          ],
          choices: [ { leap: [ 1, 1 ], steps: { any: true } } ],
          range: [ { file: [ 'd', 'f' ], rank: [ '8', '10' ] } ]
        }
      }
    ]
  ]
}
```