# Guide to using the MDN() function
This guide is aimed at people wanting to use the mdn.js file in their project to parse custom piece movement descriptions. Although I may do a full movement parser in the future (one that gives you directly the possible moves from a strating position/condition/board), this is not a guarantee. As such, I am making this guide to help you understand how you're supposed to use this piece of software and the object it returns when used.

# Basic usage
To use the MDN function, you must first import the file into your project. This can be done using the `import` keyword or using the `require` function if you are using Node.
```js
import MDN from "./mdn.js";
---------------------------------
const {MDN} = require("./mdn.js");
```
Once this is done, all you need to do is call the function with your description as the sole argument. The description should be a simple string.
```js
var result = MDN("B=F0");
```
In case of a syntax error in your description, the function will throw an error.
```js
var result = MDN("B = F0");
--> Error: Could not match the MDN notation "B = F0" // This is caused by the spaces in the description
```

# Understanding the result
Now that you have your result object, it may be a bit hard to understand how everything is laid out and how this describes the possible movements of a piece on the board.

Before checking any kind of examples, if you didn't read this article, go do it right now: http://ccif.sourceforge.net/modified-betza-notation.html. This guide will not go back over the essentials of this notation, and will assume you understand how it works and how it is structured.

## Piece/macro description
Here is a theoritical (and impossible) description for a piece, that contains every possibility for the structure of the object.

### Identifier (what's before the equal sign)
```js
{
  prefix: "+"             // The piece prefix. Can be any letter used for promotion.
  piece: "M"              // The piece identifier. Can be a single PieceLetter or a composite piece name encased in colons (":Mon:").
  macro: "M"              // The macro identifier. Replaces the piece identifier if it is preceded by a @.
  suffix: "n"             // The suffix.
  reflected3DBoard: true  // If the 3D board needs to be reflected for the black pieces.
  threeDBoard: "3"        // The 3d board this rule applies to.
  reflected4DBoard: true  // If the 4D board needs to be reflected for the black pieces.
  fourDBoard: [ { threeDBoard: [ '3' ] }, { threeDBoard: [ '4' ] } ]  // The 4D board this rule applies to.
```
Notes:
- There cannot be both a threeDBoard and a fourDBoard property in the object at the same time.
- There cannot be both a piece and macro property in the object at the same time. Also, macros do not allow for prefixes.

### Sequence (what's after the equal sign)
The main sequence of moves. **All legs of the sequence have to executed if possible.**
```js
  sequence: [
    [                     // The first leg of the sequence. Up to one of the moves detailled inside it has to de executed.
      {                   // The first possible move of the first leg.
 ```
 
 ### Prefix
 The prefix of this move. **All conditions inside of it have to be satisfied for the move to be legal.**
 ```js
        prefix: {
          setup: {        // The setup operator. Accepts a piece set.
            pieceSet: { pieces: [ 'C' ], inverted: true, colorSensitive: true } // A piece set. All piece sets are structured in the same way.
          },
          decisive: true, // The decision operator.
          range: [        // The range condition for that move. All ranges have to be satisfied for the move to be legal.
            {             // The first range. As an example, this range would be represented as [a-g1-4B-F5-8].
              file: [ 'a', 'g' ],
              rank: [ '1', '4' ],
              threeDLevel: [ 'B', 'F'],
              fourDRow: [ '5', '8']
            },
            { threatened: true },  // The second range. A range object may only contain "threatened: true" (+), "unthreatened: true" (*), or "unmoved: true" (:). Edge and inner squares are automatically converted to regular ranges.
          ],
          condition: {    // The conditional operator. Has to be satisfied for the move to be legal.
            pieceSet: { ... }, // The pieces thath the conditional operator accepts
            range: { ... }    // The range on which those pieces have to be for the condition to be met.
          }
        },
```

### Move
The move itself. More details on the rules for each part below.
```js
        move: {
          modifiers: {                // The modifiers for the move. Both the directional modifiers and modifiers (if there is any of each) have to be satisifed.
            directionalModifiers: {   // The directional modifiers. Exactly one has to be satisfied, if there is any, for the move to be legal.
              forward: {              // The "f" modifier.
                range: { ... }        // A range on which the modifier applies. This isn't included in the original article, but directional modifiers accept board ranges.
              },
              'forward/sidewards': { amalgamated: [ 'forward', 'sidewards' ] }  // The "(fs)" amalgamated directional modifier. Both directions have to be satisifed (used for non-orthognoal movement).
            },
            prefixes: {               // The other, more general prefixes. All restrictive ones have to be satisifed for the move to be legal. Note that certain ones like "d" or "t" aren't restrictive.
              capture: {              // The "c" restrictive modifier.
                pieceSet: { ... }     // The piece set that is allowed to be captured.
              },
              torus: {                // The "oo" modifier.
                range: { ... }        // The range detailling what file and ranks are connected.
              },
              flipAny : {}            // The "xy" modifier. If a prefix isn't followed by anything, its value will simply be an empty object.
            }
          },
          choices: [                  // The different choices for this move, or the different movements that compose this move. Exactly one of them has to be executed.
            {                         // The "W" or ":1,0:" basic leaper followed by a "0", or the "R" basic leaper. 
              leap: [ 0, 1 ],         // The leap movement vector.
              circular: '(r)',        // The circular suffix.
              any: true               // The number of steps this is repeated. Can be nothing, "any: true" (0), "max: true" (0*), "edgeRider: true" (*), "limited: <Number>" (n) or "exact: <Number>" (0n)
            },
            {                         // A complex rider like "(R-B)".
              sequence: [ ... ]       // The sequence that composes the complex rider. The structure is recursive from this point.
            }                         // Like any other choice, it may contain steps and circular information.
          ]
        }
```
Notes: 
- Directional modifiers will throw an error if followed by a piece set.
- Each modifier in their respective category have to be unique, otherwise they will throw an error.
- All prefixes allow a range, but currently only the cylindrical and torus ones have a use for it.
- Only registered double/"any" prefixes are allowed, trying to use the other ones hrows an error.
- Choices are not unique. Multiple identical leapers/sequences are allowed.

### The rest of the definition
```js
      },
      { ... } // The second possible move of the first leg.
    ],
    [ ... ]   // The second leg.
  ]
}
```


### Full object
```js
{
  prefix: "+"             // The piece prefix. Can be any letter used for promotion.
  piece: "M"              // The piece identifier. Can be a single PieceLetter or a composite piece name encased in colons (":Mon:").
  macro: "M"              // The macro identifier. Replaces the piece identifier if it is preceded by a @.
  suffix: "n"             // The suffix.
  reflected3DBoard: true  // If the 3D board needs to be reflected for the black pieces.
  threeDBoard: "3"        // The 3d board this rule applies to.
  reflected4DBoard: true  // If the 4D board needs to be reflected for the black pieces.
  fourDBoard: [ { threeDBoard: [ '3' ] }, { threeDBoard: [ '4' ] } ]  // The 4D board this rule applies to.
  sequence: [
    [                     // The first leg of the sequence. Up to one of the moves detailled inside it has to de executed.
      {                   // The first possible move of the first leg.
        prefix: {
          setup: {        // The setup operator. Accepts a piece set.
            pieceSet: { pieces: [ 'C' ], inverted: true, colorSensitive: true } // A piece set. All piece sets are structured in the same way.
          },
          decisive: true, // The decision operator.
          range: [        // The range condition for that move. All ranges have to be satisfied for the move to be legal.
            {             // The first range. As an example, this range would be represented as [a-g1-4B-F5-8].
              file: [ 'a', 'g' ],
              rank: [ '1', '4' ],
              threeDLevel: [ 'B', 'F'],
              fourDRow: [ '5', '8']
            },
            { threatened: true },  // The second range. A range object may only contain "threatened: true" (+), "unthreatened: true" (*), or "unmoved: true" (:). Edge and inner squares are automatically converted to regular ranges.
          ],
          condition: {    // The conditional operator. Has to be satisfied for the move to be legal.
            pieceSet: { ... }, // The pieces thath the conditional operator accepts
            range: { ... }    // The range on which those pieces have to be for the condition to be met.
          }
        },
        move: {
          modifiers: {                // The modifiers for the move. Both the directional modifiers and modifiers (if there is any of each) have to be satisifed.
            directionalModifiers: {   // The directional modifiers. Exactly one has to be satisfied, if there is any, for the move to be legal.
              forward: {              // The "f" modifier.
                range: { ... }        // A range on which the modifier applies. This isn't included in the original article, but directional modifiers accept board ranges.
              },
              'forward/sidewards': { amalgamated: [ 'forward', 'sidewards' ] }  // The "(fs)" amalgamated directional modifier. Both directions have to be satisifed (used for non-orthognoal movement).
            },
            prefixes: {               // The other, more general prefixes. All restrictive ones have to be satisifed for the move to be legal. Note that certain ones like "d" or "t" aren't restrictive.
              capture: {              // The "c" restrictive modifier.
                pieceSet: { ... }     // The piece set that is allowed to be captured.
              },
              torus: {                // The "oo" modifier.
                range: { ... }        // The range detailling what file and ranks are connected.
              },
              flipAny : {}            // The "xy" modifier. If a prefix isn't followed by anything, its value will simply be an empty object.
            }
          },
          choices: [                  // The different choices for this move, or the different movements that compose this move. Exactly one of them has to be executed.
            {                         // The "W" or ":1,0:" basic leaper followed by a "0", or the "R" basic leaper. 
              leap: [ 0, 1 ],         // The leap movement vector.
              circular: '(r)',        // The circular suffix.
              any: true               // The number of steps this is repeated. Can be nothing, "any: true" (0), "max: true" (0*), "edgeRider: true" (*), "limited: <Number>" (n) or "exact: <Number>" (0n)
            },
            {                         // A complex rider like "(R-B)".
              sequence: [ ... ]       // The sequence that composes the complex rider. The structure is recursive from this point.
            }                         // Like any other choice, it may contain steps and circular information.
          ]
        }
      },
      { ... } // The second possible move of the first leg.
    ],
    [ ... ]   // The second leg.
  ]
}
```

## Promotion description
*TBA*
