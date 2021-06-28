# modified-betza-notation-js
A parser for the Modified Betza Notation used by the Compact Chess Interchange Format.

# What is this for?
This file is a parser of the Modified Betza Notation used by the Compact Chess Interchange Format to describe the movements of chess pieces on the board. It is built upon the Funny Betza Notation, and adds many modifiers and syntaxes to allow the description of nearly any piece on the board.

## Examples
* The pieces in Orthodox Chess described in that notation:
    * P|Pawn|=mfW+cefF+[1-2]mefW02
    * N|Knight|=N
    * B|Bishop|=F0
    * R|Rook|=W0
    * Q|Queen|=R+B
    * K|King|=W+F

# How does it work?
The MBN function takes in a string representing the defintion of a single piece, and returns an Object that decomposes every part of the movement of that piece, in a (hopefully) easy-to-use manner. You will find in the repository a guide on how to properly use the returned Object to create the move options of the piece.

In the case of a syntax error, the function will simply throw an Error detailling what went wrong. Do be aware that the error may not be directly linked to the problem, and may appear as a consequence of the error messing up an earlier part of the process.

## Notes
~~Normally, the MBN notation does not allow for whitespaces inside the definition. The MBN function currently does allow them, but only around the equal sign to improve readability.~~ This is no longer the case.

This function has been made following Backus-Naur Form present at the end of this article: http://ccif.sourceforge.net/modified-betza-notation.html. However, this form is not complete and does not include all the elements of the MBN, and is even erroneous in some places. I have made some decisions regarding some defintions in that form that I have written in their respective functions as comments.

## Examples 
- The Pawn piece passed through the MBN function (With developBasicLeapers true. This will be the case for all following exmples).
```js
Input: P|Pawn|=mfW+cefF+[1-2]mefW02
Output: 
{
  piece: 'P',
  sequence: [
    [
      {
        move: {
          modifiers: {
            directionalModifiers: { forward: {} },
            prefixes: { move: {} }
          },
          choices: [ { leap: [ 0, 1 ] } ]
        }
      },
      {
        move: {
          modifiers: {
            directionalModifiers: { forward: {} },
            prefixes: { capture: {}, enPassant: {} }
          },
          choices: [ { leap: [ 1, 1 ] } ]
        }
      },
      {
        prefix: {
          range: [ { rank: [ '1', '2' ] } ]
        },
        move: {
          modifiers: {
            directionalModifiers: { forward: {} },
            prefixes: { move: {}, enPassant: {} }
          },
          choices: [ { leap: [ 0, 1 ], exact: '2' } ]
        }
      }
    ]
  ]
}
```
- A fairy Bishop piece, that is circular on the b and g ranks (it can jump from the b to the g rank as if they were next to each other, but not from the a or h rank). ~~This returns an error as, currently, modifiers (here 'o') cannot take in a BoardRange.~~ Proper support has now been added.
```js
Input: B=o[b,g]B
Output:
{
  piece: 'B',
  sequence: [
    [
      {
        move: {
          modifiers: {
            prefixes: {
              cylindrical: {
                range: [ { file: [ 'b' ] }, { file: [ 'g' ] } ]
              }
            }
          },
          choices: [ { leap: [ 1, 1 ], any: true } ]
        }
      }
    ]
  ]
}
```
- The Cannon, a particularly complex piece of Xiangqi, a Chinese version of chess, often used to represent and/or explain the concept of hopping (https://en.wikipedia.org/wiki/Xiangqi#Cannon).
```js
Input: C=a{^C}p{^C}R+[d-f1-3]a{^C}p{^C}B[d-f1-3]+[d-f8-10]a{^C}p{^C}B[d-f8-10]
Output: 
{
  piece: 'C',
  sequence: [
    [
      {
        move: {
          modifiers: {
            prefixes: {
              all: { pieceSet: { pieces: [ 'C' ], inverted: true } },
              hop: { pieceSet: { pieces: [ 'C' ], inverted: true } }
            }
          },
          choices: [ { leap: [ 0, 1 ], any: true } ]
        }
      },
      {
        prefix: {
          range: [ { file: [ 'd', 'f' ], rank: [ '1', '3' ] } ]
        },
        move: {
          modifiers: {
            prefixes: {
              all: { pieceSet: { pieces: [ 'C' ], inverted: true } },
              hop: { pieceSet: { pieces: [ 'C' ], inverted: true } }
            }
          },
          choices: [ { leap: [ 1, 1 ], any: true } ],
          range: [ { file: [ 'd', 'f' ], rank: [ '1', '3' ] } ]
        }
      },
      {
        prefix: {
          range: [ { file: [ 'd', 'f' ], rank: [ '8', '10' ] } ]
        },
        move: {
          modifiers: {
            prefixes: {
              all: { pieceSet: { pieces: [ 'C' ], inverted: true } },
              hop: { pieceSet: { pieces: [ 'C' ], inverted: true } }
            }
          },
          choices: [ { leap: [ 1, 1 ], any: true } ],
          range: [ { file: [ 'd', 'f' ], rank: [ '8', '10' ] } ]
        }
      }
    ]
  ]
}
```
