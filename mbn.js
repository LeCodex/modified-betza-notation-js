/*
From http://ccif.sourceforge.net/modified-betza-notation.html:
	<MBN>                 ::= <Identifier> '=' <MoveDefinition>
	<Identifier>          ::= ( '@' <MacroIdentifier> | <PieceIdentifier> ) <Suffix> <BoardIdentifier>?
	<PieceIdentifier>     ::= [+-#*$%&]? <PieceLetter>
	<PieceLetter>         ::= [A-Za-z] | ':' [A-Za-z] [A-Za-z0-9]? [A-Za-z0-9]? ':'
	<Suffix>              ::= [A-Za-z0-9] [A-Za-z0-9]*
	<BoardIdentifier>     ::= <3dBoardIdentifier> | <4dBoardIdentifier>
	<3dBoardIdentifier>   ::= '<' <BoardNumbers> '>' | '<' '<' <BoardNumbers> '>' '>'
	<4dBoardIdentifier>   ::= <4dBoardIdentifier1> | <4dBoardIdentifier2>
	<4dBoardIdentifier1>  ::= '<' <3dBoardIdentifier> ';' <3dBoardIdentifier> '>'
	<4dBoardIdentifier2>  ::= '<' '<' <BoardNumbers> ';' <BoardNumbers> '>' '>'
	<BoardNumbers>        ::= '*' | <ListOfNumbers>
	<ListOfNumbers>       ::= <Number> (',' <Number>)*
	<MoveDefinition>      ::= <MoveSequence>
	<MoveSequence>        ::= <OptionalMove> ( '-' '-'? <OptionalMove> )*
	<OptionalMove>        ::= <CombinedMove> | '[' <MoveSequence> ']' | '{' <MoveSequence> '}'
	<CombinedMove>        ::= <PartialMove> ( '+' <PartialMove> )*
	<PartialMove>         ::= <MovePrefix> <BoardRange>? <ModifiedMove> <BoardRange>?
	<MovePrefix>          ::= '!'? <BoardTransition>? <Condition>?
	<ModifiedMove>        ::= <Attackers>* <Modification>* <Move> <Move>*
	<Attackers>           ::= <PieceSet>
	<Move>                ::= <ComplexRider> | <BasicLeaper> ( <Circular>? <Steps> )?
	<ComplexRider>        ::= '(' <MoveSequence> ')' <DirectionalModifier>? <Steps>?
	<Steps>               ::= '0' ( '*' | <Number> )? | '*' '*' | '#' | <Number>
	<Circular>            ::= <Amalgamated> | '(' <Direction>+ ')'
	<BoardTransition>     ::= <BoardTransition2> | <BoardTransition3>
	<BoardTransition2>    ::= '<' <Transition> (';' <Transition>)? '>'
	<BoardTransition3>    ::= <SingleTransition> (';' <SingleTransition>)?
	<SingleTransition>    ::= <Transition> | '<' <Transition> '>'
	<Transition>          ::= <RelativeTransition> | <AbsoluteTransition>
	<RelativeTransition>  ::= '+'? '-'? <Number>
	<AbsoluteTransition>  ::= <ListOfNumbers>
	<BasicLeaper>         ::= [A-Z]
	<Modification>        ::= <DirectionalModifier> | [aceghijkmnopquwy] <PieceSet>?
	<DirectionalModifier> ::= <Amalgamated> | <Direction>
	<Direction>           ::= [bdflrstvz]
	<Amalgamated>         ::= '(' <Direction> <Direction> ')'
	<BoardRange>          ::= '[' '^'? <CompoundRange> ']'
	<CompoundRange>       ::= <SingleRange> ( ',' <SingleRange> )*
	<SingleRange>         ::= ( <FileRange> | <RankRange> | <SquareRange> ) <3dRange>? <4dRange>?
	<FileRange>           ::= <File> ( '-' <File> )?
	<RankRange>           ::= <Rank> ( '-' <Rank> )?
	<SquareRange>         ::= <FileRange> <RankRange>
	<3dRange>             ::= <3dLevel> ( '-' <3dLevel> )?
	<4dRange>             ::= <4dRow> ( '-' <4dRow> )?
	<File>                ::= <Number>
	<Rank>                ::= [a-z]
	<3dLevel>             ::= [A-H]
	<4dRow>               ::= [1-8]
	<Number>              ::= [0-9]+
	<PieceSet>            ::= '{' '!'? '^'? <PieceLetter>* '}'
	<Condition>           ::= '/' ( <PieceSet> | <PieceLetter> ) ( <BoardRange> | <Square> ) '/'
	<Square>              ::= <File> <Rank> <3dLevel>? <4dRow>?


The decomposition will follow this form, with earlier steps only checking for the correct characters and later ones checking for the more precise syntax
*/

const {Identifier, MacroIdentifier, PieceIdentifier, PieceLetter, Suffix, BoardIdentifier, ThreeDBoardIdentifier, FourDBoardIdentifier, BoardNumbers, ListOfNumbers, BoardRange, CompoundRange, SingleRange, FileRange, RankRange, ThreeDRange, FourDRange, PieceSet, Square} = require("./definitions.js")

const developBasicLeapers = true;
// const developModifiers = true;

// (c) 2007 Steven Levithan <stevenlevithan.com>
// MIT License
/*** matchRecursiveRegExp
	Accepts a string to search, a left and right format delimiter
	as regex patterns, and optional regex flags. Returns an array
	of matches, allowing nested instances of left/right delimiters.
	Use the "g" flag to return all matches, otherwise only the
	first is returned. Be careful to ensure that the left and
	right format delimiters produce mutually exclusive matches.
	Backreferences are not supported within the right delimiter
	due to how it is internally combined with the left delimiter.
	When matching strings whose format delimiters are unbalanced
	to the left or right, the output is intentionally as a
	conventional regex library with recursion support would
	produce, e.g. "<<x>" and "<x>>" both produce ["x"] when using
	"<" and ">" as the delimiters (both strings contain a single,
	balanced instance of "<x>").

	examples:
		matchRecursiveRegExp("test", "\\(", "\\)")
			returns: []
		matchRecursiveRegExp("<t<<e>><s>>t<>", "<", ">", "g")
			returns: ["t<<e>><s>", ""]
		matchRecursiveRegExp("<div id=\"x\">test</div>", "<div\\b[^>]*>", "</div>", "gi")
			returns: ["test"]

*/
// https://blog.stevenlevithan.com/archives/javascript-match-recursive-regexp
function matchRecursiveRegExp (str, left, right, flags) {
	var	f = flags || "",
		g = f.indexOf("g") > -1,
		x = new RegExp(left + "|" + right, f),
		l = new RegExp(left, f.replace(/g/g, "")),
		a = [],
		t, s, m;

	do {
		t = 0;
		while (m = x.exec(str)) {
			if (l.test(m[0])) {
				if (!t++) s = x.lastIndex;
			} else if (t) {
				if (!--t) {
					a.push(str.slice(s, m.index));
					if (!g) return a;
				}
			}
		}
	} while (t && (x.lastIndex = s));

	return a;
}

function addWarning(result, warning) {
	if (!result.warnings) result.warnings = [];
	result.warnings.push(warning);
	return result;
}


function MBN(description) {
	// <MBN>                 ::= <Identifier> '=' <MoveDefinition>
	var result = {};
	var match = description.match(/^(?<Identifier>\S+)=(?<MoveDefinition>\S+)$/);

	if (!match) { throw new Error("Could not match the MBN notation \"" + description + "\"") }

	result = Identifier(match.groups.Identifier, result);
	if (!result.error) result = MoveDefinition(match.groups.MoveDefinition, result);

	return result;
}

function MoveDefinition(moveDefinition, result) {
	// <MoveDefinition>      ::= <MoveSequence>
	result = MoveSequence(moveDefinition, result);
	return result;
}

function MoveSequence(moveSequence, result) {
	// <MoveSequence>        ::= <OptionalMove> ( '-' '-'? <OptionalMove> )*
	if (!/^\S+(--?\S+)*$/.test(moveSequence)) { throw new Error("Could not match the MoveSequence \"" + moveSequence + "\""); } // Redundant, since all characters are non-whitespace already

	var insides = matchRecursiveRegExp(moveSequence, "\\(", "\\)", "g"); 	// Get the insides of parentheses,
	insides.push(...matchRecursiveRegExp(moveSequence, "\\[", "\\]", "g"));	// brackets,
	insides.push(...matchRecursiveRegExp(moveSequence, "{", "}", "g")); 	// and curly brackets

	var cleanedSquence = moveSequence;
	for (var i = 0; i < insides.length; i++) {
		cleanedSquence = cleanedSquence.replace(insides[i], "~" + i + "~"); // Replaces those insides with a neutral code
	}

	var optionalMoves = cleanedSquence.matchAll(/-?(?<IsSequence1>-)?(?<OptionalMove1>\S+?)(?=(?<!-)-)|-?(?<IsSequence2>-)?(?<OptionalMove2>\S+)/g); // Matches and separates all the sequences.

	if (!optionalMoves) { throw new Error("Could not match the OptionalMoves of the MoveSequence \"" + moveSequence + "\""); } // Again, redundant

	for (var match of optionalMoves) {
		var optionalMove = match.groups.OptionalMove1 ? match.groups.OptionalMove1 : match.groups.OptionalMove2;
		console.log(moveSequence, optionalMove, match);

		for (var i = 0; i < insides.length; i++) {
			optionalMove = optionalMove.replace("~" + i + "~", insides[i]); // Get the insides back in
		}

		result = OptionalMove(optionalMove, result);

		if (match.groups.IsSequence1 || match.groups.IsSequence2) result.sequence[result.sequence.length - 1] = [ { move: { modifiers: [ { modifier: "independant" } ], choices: [ { sequence: [ result.sequence[result.sequence.length - 1] ] } ] } } ];

		if (result.error) return result;
	}

	return result;
}

function OptionalMove(optionalMove, result) {
	// <OptionalMove>        ::= <CombinedMove> | '[' <MoveSequence> ']' | '{' <MoveSequence> '}'
	var match = optionalMove.match(/^\[(?<MoveSequence1>[^\s\[]+)\]$|^{(?<MoveSequence2>[^\s{]+)}$|^(?<CombinedMove>\S+)$/);

	if (!match) { throw new Error("Could not match the OptionalMove \"" + optionalMove + "\"") }

	if (match.groups.CombinedMove) result = CombinedMove(match.groups.CombinedMove, result);
	if (match.groups.MoveSequence1 && !result.error) result = MoveSequence(match.groups.MoveSequence1, result);
	if (match.groups.MoveSequence2 && !result.error) result = MoveSequence(match.groups.MoveSequence2, result);

	return result;
}

function CombinedMove(combinedMove, result) {
	// <CombinedMove>        ::= <PartialMove> ( '+' <PartialMove> )*
	if (!/^\S+(\+?\S+)*$/.test(combinedMove)) { throw new Error("Could not match the CombinedMove \"" + combinedMove + "\"") } // Redundant, since all characters non-whitespace already

	var partialMoves = combinedMove.matchAll(/\+?(\S+?)(?=\+(?![^{]*}|[^\[]*]|[^(*]*\)|[^<]*>))|\+?(\S+)/g) // Matches and separates all the partial moves.

	if (!partialMoves) { throw new Error("Could not match the PartialMoves of the CombinedMove \"" + combinedMove + "\"") } // Again, redundant

	if (!result.sequence) result.sequence = [];
	// console.log("Result:", result);
	result.sequence.push([]);
	for (var partialMove of partialMoves) {
		var match = partialMove[1] ? partialMove[1] : partialMove[2];
		// console.log(partialMove, match);

		result = PartialMove(match, result);
		if (result.error) break;
	}

	return result;
}

function PartialMove(partialMove, result) {
	// <PartialMove>         ::= <MovePrefix> <BoardRange>? <ModifiedMove> <BoardRange>?
	var match = partialMove.match(/^(?<MovePrefix>(!({[A-Za-z0-9:^!]+})?|#)?(<[+\-0-9do]+>)?(\/[\[\]{}a-zA-Z0-9\-^!]+\/)?)(?<BoardRange1>\[[#.+*:0-9a-zA-Z^\-,]+\])?(?<ModifiedMove>\S+?)(?<BoardRange2>\[[#.+*:0-9a-zA-Z^\-,]+\])?$/);

	if (!match) { throw new Error("Could not match the PartialMove \"" + partialMove + "\"") }
	var range1 = null, range2 = null, move = {};

	if (match.groups.BoardRange1) range1 = BoardRange(match.groups.BoardRange1, result);
	if (match.groups.BoardRange2 && !result.error) range2 = BoardRange(match.groups.BoardRange2, result);

	if (match.groups.MovePrefix || range1 && !result.error) move.prefix = MovePrefix(match.groups.MovePrefix || "", result, range1);
	if (match.groups.ModifiedMove || range2 && !result.error) move.move = ModifiedMove(match.groups.ModifiedMove || "", result, range2);

	if (!result.error) { result.sequence[result.sequence.length - 1].push(move); }

	return result;
}

function MovePrefix(movePrefix, result, range) {
	// <MovePrefix>          ::= '!'? <BoardTransition>? <Condition>?
	var prefix = {};
	var match = movePrefix.match(/^((?<Setup>!)(?<PieceSet>{[+\-#*$%&A-Za-z0-9:^!]+})?|(?<Decision>#))?(?<BoardTransition><[a-zA-H0-9\-,^]+>)?(?<Condition>\/[\[\]{}A-Za-z0-9\-,^]+\/)?$/);

	if (!match) { throw new Error("Could not match the MovePrefix \"" + movePrefix + "\"") }

	if (range) prefix.range = range;
	if (match.groups.Setup) prefix.setup = {};
	if (match.groups.PieceSet) prefix.setup.pieceSet = PieceSet(match.groups.PieceSet, result);
	if (match.groups.Decision) prefix.decisive = true;
	if (match.groups.BoardTransition) prefix.boardTransition = BoardTransition(match.groups.BoardTransition, result);
	if (match.groups.Condition && !result.error) prefix.condition = Condition(match.groups.Condition, result);

	return prefix;
}

function ModifiedMove(modifiedMove, result, range) {
	// ModifiedMove>         ::= <Attackers>* <Modification>* <Move> <Move>*
	// console.log(modifiedMove);

	var move = {
		modifiers: {},
		choices: []
	};
	var match = modifiedMove.match(/^(?<Attackers>{[A-Za-z0-9,!^:]+})?(?<Modifications>(([bflrsvz]|\([bflrsvz]{2}\)|((?<M>[acdeghijkmnopqtuwy])(y|\k<M>)?\??))({[A-Za-z0-9!^:]+})?(\[[\-^a-zA-H0-9,]+\])?)*)(?<Moves>\S+)$/);

	if (!match) { throw new Error("Could not match ModifiedMove \"" + modifiedMove + "\"") }

	if (range) move.range = range;
	if (match.groups.Attackers) move.modifiers.attackers = Attackers(match.groups.Attackers, result);
	if (match.groups.Modifications && !result.error) Object.assign(move.modifiers, Modifications(match.groups.Modifications, result));
	if (match.groups.Moves && !result.error) move.choices = Moves(match.groups.Moves, result);

	if (!Object.keys(move.modifiers).length) delete move.modifiers;

	return move;
}

function Attackers(attackers, result) {
	// <Attackers>           ::= <PieceSet>
	set = PieceSet(attackers, result);
	return set;
}

function Moves(moves, result) {
	// <Move>                ::= <ComplexRider> | <BasicLeaper> ( <Circular>? <Steps> )?
	// <ComplexRider>        ::= '(' <MoveSequence> ')' <DirectionalModifier>? <Steps>?  ; I've seen multipl examples where the Sequence is between two curly brackets instead of parentheses. I'm following the form for now
	// <BasicLeaper>         ::= [A-Z]  ; Added the defintion of Extended Base Moves (Example: :1,4:)
	// <Circular>            ::= <Amalgamated> | '(' <Direction>+ ')'  ; Changed to <Amalgamated> | '(' <Direction> ')' since there are no direction modifiers with more than two letters
	// <DirectionalModifier> ::= <Amalgamated> | <Direction>
	// <Direction>           ::= [bdflrstvz]
	// <Amalgamated>         ::= '(' <Direction> <Direction> ')'
	if (!/^(\(\S+\)([bdflrstvz]|\([bdflrstvz]{2}\))?([*#0-9]+)?|([A-Z]|:[0-9]+,[0-9]+:)((\([bdflrstvz]{,2}\))?[*#0-9]+)?)+$/.test(moves)) { throw new Error("Could not match the Moves \"" + moves + "\"") }

	var parsedMoves = [];
	var individualMoves = moves.matchAll(/(?<ComplexRider>\((?<MoveSequence>\S+)\)(?<DirectionalModifier>[bdflrstvz]|\([bdflrstvz]{2}\))?(?<Steps1>[*#0-9]+)?)|((?<BasicLeaper>[A-Z])|(?<ExtendedBaseMove>:[0-9]+,[0-9]+:))((?<Circular>\([bdflrstvz]{0,2}\))?(?<Steps2>[*#0-9]+))?/g) // Matches and separates all the moves.

	if (!individualMoves) { throw new Error("Could not match the Moves of the Moves \"" + moves + "\"") } // Again, redundant

	for (var match of individualMoves) {
		var move = {};

		if (match.groups.ComplexRider) {
			var result1 = MoveSequence(match.groups.MoveSequence, {});

			if (result1.warnings) result = addWarning(result, ...result1.warnings);
			if (result1.error) { result.error = result1.error; return []; }

			move.sequence = result1.sequence;
			if (match.groups.DirectionalModifier) move.circular = match.groups.DirectionalModifier;
			if (match.groups.Steps1) Object.assign(move, Steps(match.groups.Steps1, result));
		} else {
			var sequence;
			if (match.groups.BasicLeaper) {
				sequence = developBasicLeapers ? BasicLeaper(match.groups.BasicLeaper, result) : { sequence: match.groups.BasicLeaper };
				if (sequence.array) {
					parsedMoves.push(...sequence.array);
					continue;
				}
			} else {
				sequence = ExtendedBaseMove(match.groups.ExtendedBaseMove, result);
			}

			Object.assign(move, sequence);
			if (match.groups.Circular && !result.error) move.circular = match.groups.Circular;
			if (match.groups.Steps2 && !result.error) Object.assign(move, Steps(match.groups.Steps2, result));
		}

		if (result.error) return [];

		parsedMoves.push(move);
	}

	return parsedMoves;
}

function BasicLeaper(basicLeaper, result) {
	// Turns the BasicLeapers into their corresponding notation
	// A		Alfil				:2,2:
	// B		Bishop				F0
	// C		Camel				:1,3:
	// D		Dabbaba				:0,2:
	// E		Empress				RN
	// F		Ferz				:1,1:
	// G (old)	Tripper				T
	// H		Threeleaper			:0,3:
	// I		Janus				BN
	// J (old)	Zebra				Z
	// K		King				WF
	// L (old)	Camel				C
	// M		Marshall			WF
	// N		Knight				:1,2:
	// O		Zero				:0,0:
	// P		Pawn				mfW+cefF+[1-2]mefW02
	// Q		Queen				RB
	// R		Rook				W0
	// S		Berolina Pawn		mfsF+cefW+[1-2]mefF02
	// T		Tripper				:3,3:
	// U		Universal Leaper	g(WF)0
	// V		Vizir				BN
	// W		Wazir				:0,1:
	// X		Explosion			(!dcy{^P}OK)0*
	// Y		Boyscout			F-[(zF)0]
	// Z		Zebra				:2,3:
	var table = {
		A: { leap: [2,2] },
		B: { leap: [1,1], any: true },
		C: { leap: [1,3] },
		D: { leap: [0,2] },
		E: { array: [ { leap: [0,1], any: true }, { leap: [1,2], any: true } ] },
		F: { leap: [1,1] },
		G: { leap: [3,3] },
		H: { leap: [0,3] },
		I: { array: [ { leap: [1,1], any: true }, { leap: [1,2], any: true } ] },
		J: { leap: [2,3] },
		K: { array: [ { leap: [0,1] }, { leap: [1,1] } ] },
		L: { leap: [1,3] },
		M: { leap: [1,2] },
		N: { leap: [1,2] },
		O: { leap: [0,0] },
		P: "mfW+cefF+[1-2]mefW02",
		Q: { array: [ { leap: [0,1], any: true }, { leap: [1,1], any: true } ] },
		R: { leap: [0,1], any: true },
		S: "mfsF+cefW+[1-2]mefF02",
		T: { leap: [3,3] },
		U: "g(WF)0",
		V: { array: [ { leap: [1,1], any: true }, { leap: [1,2], any: true } ] },
		W: { leap: [0,1] },
		X: "(!dcy{^P}OK)0*",
		Y: "F-[(zF)0]",
		Z: { leap: [2,3] }
	}

	var move = table[basicLeaper];

	if (typeof(move) === "object") {
		return move;
	} else {
		var result1 = MoveSequence(move, {});

		if (result1.warnings) result = addWarning(result, ...result1.warnings);
		if (result1.error) { result.error = result1.error; return; }

		return { sequence: result1.sequence };
	}
}

function ExtendedBaseMove(extendedBaseMove, result) {
	// <ExtendedBaseMove>    ::= ':' <Number> ',' <Number> ':'  ; Not present in the original form
	var match = extendedBaseMove.match(/^:([0-9]+),([0-9]+):$/);

	if (!match) { throw new Error("Could not match the ExtendedBaseMove \"" + extendedBaseMove + "\"") }

	if (match[1] > match[2]) { throw new Error("First component of the ExtendedBaseMove \"" + extendedBaseMove + "\" is greater than its second component") }

	return { leap: [match[1], match[2]] };
}

function Steps(steps, result) {
	// <Steps>               ::= '0' ( '*' | <Number> )? | '*' '*' | '#' | <Number>  ; Removed # as I didn't find what it was used for
	var match = steps.match(/^((?<Zero>0)((?<Maximal>\*)|(?<Exact>[0-9]+))?|(?<Edge>\*)|(?<Limited>[0-9]+))$/);

	if (!match) { throw new Error("Could not match the Steps \"" + steps + "\"") }

	if (match.groups.Maximal) {
		return { max: true };
	} else if (match.groups.Exact) {
		return { exact: match.groups.Exact };
	} else if (match.groups.Zero) {
		return { any: true };
	} else if (match.groups.Edge) {
		return { edgeRider: true };
	} else if (match.groups.Limited) {
		return { limited: match.groups.Limited };
	}
}

function BoardTransition(boardTransition, result) {
	// <BoardTransition>     ::= <BoardTransition2> | <BoardTransition3>  ; Testing both

	var transition = {};
	transition.transitions = BoardTransition2(boardTransition, result);
	transition.type = 2;

	if (!transition.transitions) {
		transition.transitions = BoardTransition3(boardTransition, result);
		transition.type = 3;
	}

	return transition;
}

function BoardTransition2(boardTransition, result) {
	// <BoardTransition2>    ::= '<' <Transition> (';' <Transition>)? '>'
	var match = boardTransition.match(/<(?<Transition1>[+\-0-9,do]+)(;(?<Transition2>[+\-0-9,]+))?>/);

	if (!match) {
		result = addWarning(result, "Could not match the BoardTransition2 \"" + boardTransition + "\"");
		return; // May be able to match BoardTransition3
	}

	var transition = [];
	transition.push(Transition(match.groups.Transition1, result));
	if (match.groups.Transition2 && !result.error) transition.push(Transition(match.groups.Transition2, result));

	if (!result.error) return transition

	result = addWarning(result, "Could not match the Transitions of the BoardTransition2 \"" + boardTransition + "\"");
}

function BoardTransition3(boardTransition, result) {
	// <BoardTransition3>    ::= <SingleTransition> (';' <SingleTransition>)?
	var match = boardTransition.match(/<(?<SingleTransition1>[<>+\-0-9,do]+)(;(?<SingleTransition2>[<>+\-0-9,]+))?>/);

	if (!match) { throw new Error("Could not match the BoardTransition \"" + boardTransition + "\"") }

	var transition = [];
	transition.push(SingleTransition(match.groups.SingleTransition1, result));
	if (match.groups.SingleTransition2 && !result.error) transition.push(SingleTransition(match.groups.SingleTransition2, result));

	if (!result.error) return transition;
}

function SingleTransition(singleTransition, result) {
	// <SingleTransition>    ::= <Transition> | '<' <Transition> '>'
	var match = singleTransition.match(/(?<Transition1>[+\-0-9,do]+)|<(?<Transition2>[+\-0-9,do]+)>/);

	if (!match) { throw new Error("Could not match the SingleTransition \"" + singleTransition + "\"") }

	if (match.groups.Transition1) {
		var transition = Transition(match.groups.Transition1, result);

		if (!result.error) return transition;
	} else if (match.groups.Transition2) {
		var transition = Transition(match.groups.Transition2, result);
		transition.reflected = true;

		if (!result.error) return transition;
	}
}

function Transition(transition, result) {
	// <Transition>          ::= <RelativeTransition> | <AbsoluteTransition>
	// <RelativeTransition>  ::= '+'? '-'? <Number>
	// <AbsoluteTransition>  ::= <ListOfNumbers>
	var match = transition.match(/((?<RelativeTransition>\+?-?[0-9]+)|(?<AbsoluteTransition>[0-9,]+))(?<Diagonal>d)?(?<Orthogonal>o)?/);

	if (!match) { throw new Error("Could not match the Transition \"" + transition + "\"") }

	var trans = {}
	if (match.groups.RelativeTransition) {
		trans.transition = [ match.groups.RelativeTransition ];
	} else if (match.groups.AbsoluteTransition) {
		trans.transition = ListOfNumbers(match.groups.AbsoluteTransition, result);
	}

	if (match.groups.Diagonal && !result.error) trans.diagonal = true;
	if (match.groups.Orthogonal && !result.error) trans.orthogonal = true;

	if (result.error) return;

	return trans;
}

function Modifications(modifications, result) {
	// <Modification>        ::= <DirectionalModifier> | [aceghijkmnopquwy] <PieceSet>?
	var parsedModifications = {
		directionalModifiers: {},
		prefixes: {}
	};

	var individualModifications = modifications.matchAll(/((?<DirectionalModifier>[bflrsvz])|\((?<Amalgamated>[bflrsvz]{2})\)|((?<Prefix>(?<M>[acdeghijkmnopqtuwy])(y|\k<M>)?)(?<Optional>\?)?))(?<PieceSet>{[+\-#*$%&A-Za-z0-9!^:]+})?(?<BoardRange>\[[\-^a-zA-H0-9,]+\])?/g);

	if (!individualModifications) { throw new Error("Could not match the Modifications \"" + modifications + "\"") }

	for (var match of individualModifications) {
		var modification = {};

		if (match.groups.Prefix) {
			modification.modifier = Modifier(match.groups.Prefix, result);
			if (match.groups.PieceSet && !result.error) modification.pieceSet = PieceSet(match.groups.PieceSet, result);
			if (match.groups.BoardRange && !result.error) modification.range = BoardRange(match.groups.BoardRange, result);
			if (match.groups.Optional && !result.error) modification.optional = true;

			if (result.error) return {};

			if (parsedModifications.prefixes[modification.modifier]) { throw new Error("Double Modifier \"" + modification.modifier + "\" in Modifications \"" + modifications + "\"") }

			var key = modification.modifier;
			delete modification.modifier;
			parsedModifications.prefixes[key] = modification;
		} else {
			if (match.groups.PieceSet) { throw new Error("Invalid PieceSet \"" + match.groups.PieceSet + "\" found after the DirectionalModifier/Amalgamated \"" + match.groups.DirectionalModifier + "\"") }

			if (match.groups.DirectionalModifier) { modification.modifier = Modifier(match.groups.DirectionalModifier, result); } else { Object.assign(modification, Amalgamated(match.groups.Amalgamated, result)); }
			if (match.groups.BoardRange && !result.error) modification.range = BoardRange(match.groups.BoardRange, result);

			if (result.error) return {};

			if (parsedModifications.directionalModifiers[modification.modifier]) { throw new Error("Double DirectionalModifier \"" + modification.modifier + "\" in Modifications \"" + modifications + "\"") }

			var key = modification.modifier;
			delete modification.modifier;
			parsedModifications.directionalModifiers[key] = modification;
		}
	}

	if (!Object.keys(parsedModifications.prefixes).length) delete parsedModifications.prefixes;
	if (!Object.keys(parsedModifications.directionalModifiers).length) delete parsedModifications.directionalModifiers;

	return parsedModifications;
}

function Modifier(modifier, result) {
	// Same thing as BasicLeaper but with Modifiers
	// a	All means: move or capture. This is useful when we want to restrict either the move-only or the capture-only capability with an suffixed piece set. This modifier allows moving and capturing anyway, and cannot be superseeded.
	// b	This is the directional modifier for going backwards.
	// c	Capture only, but do not move (only). The set of captured pieces can be restricted (or extended) to a piece set following the prefix. Per default all opponent pieces can be captured. A doubled modifier (cc) allows capturing of friendly pieces, but not the capturing of enemies. And if suffixed with y (cy) all pieces, inclusively friendly pieces, can be captured. This modifier can be declared as optional, but this is only useful if combined with a following piece set.
	// d	This is the directional modifier for going any direction.
	// e	In conjunction with c: capture en passant. If doubled (ee) then this is capturing en passant only. If not doubled, then allowing en passant is an addition (to capturing). A piece set may follow, defining the pieces which can be captured en passant (default is: this piece themself, in general a Pawn). In conjunction with m: this move allows capturing en passant by the opponent.
	// f	This is the directional modifier for going forward.
	// g	Defines a leaping slider. This means it moves like the given slider, but it is jumping (leaping) instead of sliding. When doubled (gg) then it can leap over friendly pieces, but not over enemy pieces. A following optional piece set is restricting a leap, only the pieces given in piece set can be leaped (the default piece set is the set of all pieces).
	// h	Defines a halfling, that moves half the way to the edge of the board, rounded up (see Halflings).
	// i	Only the initial move of this piece has this capability. If doubled (ii), then the initial move possibility will decay with the first check to this royal piece, and will decay with a drop move, and with promotion (this means that i applies for dropped pieces and promoted pieces, but in this case ii does not apply).
	// j	This modifier is useful for jumps over hurdles. In fact for jumps a chain must be used, because modifier j means: move to any opponent piece, but without capturing (visit a piece). Either a succeeding leg is required for the destination square, or the setup operator (!) is defining a different destination square, or a capture/swap will be done, or this piece will suicicde. The jump can be restricted to a set of pieces following the prefix. This modifier is provided for defining complex jumps, in general modifier p is a useful shortcut for simple jumps. When doubled (jj) any friendly piece will be visited, but no enemy pieces. And if suffixed with a y (jy) then any piece (friendly or enemy) may be visited. This modifier can be declared as optional. It is important to note that this modifier allows royal pieces to cross checked squares, when moving to, or moving from visited square (see example below).
	// k	This piece cannot give check. If doubled (kk), then it can give check, but cannot give immediate mate. This can be restricted to a piece set following the prefix.
	// l	This is the directional modifier for going left.
	// m	Move, but not capture. This can be restricted to a piece set following the prefix. This modifier can be declared as optional, but this is only useful if combined with a following piece set.
	// n	This defines a non-jumping piece, a leaping rider will become a sliding rider. But note that in some variants the order of the decomposed legs is determined, in this case this modifier is not working.
	// o	This modifier makes the move cylindrical. Cylindrical pieces do not stop at the left or right edge of the board. This modifier can be followed by board range, defining the connected files. If doubled (oo) also the top and bottom edges of the board will be connected.
	// p	Must hop over any single hurdle, the hurdle can be anywhere in the path. When doubled (pp) it must hop over any number of hurdles (but at least one). An optional piece set following the modifier is restricting the hurdles. This modifier is redundant, but allows in most cases shorter definitions than with modifier j. This modifier can be declared as optional.
	// q	(still unused)
	// r	This is the directional modifier for going right.
	// s	This is the directional modifier for going sidewards (left or right).
	// t	The piece makes a turn, this means that it moves into the opposite direction as in the previous move. But when doubled (tt) then it means: the piece don't makes a turn (excludes a turn).
	// u	The piece can move only if all move directions are unblocked, this means that no enemy piece is blocking this piece in one of the moving directions (this implies that the piece cannot capture the enemy piece).
	// v	This is the directional modifier for going vertically (forward or backward).
	// w	Instead of capturing this piece it will swap the piece, the position of the piece at destination square will be swapped with the piece at starting square. Because the piece will not be removed it's also possible to swap with royal pieces. If doubled (ww) then swapping will be done only with friendly pieces. And if suffixed with y (wy) then swapping can be done with all pieces. An optional piece set following the modifier is defining the pieces that can be swapped. This modifier can be declared as optional.
	// x	This modifier flips an enemy piece to a friendly piece. When doubled (xx) then it will flip a friendly piece to an enemy piece. If suffixed with y (xy) then it will flip any piece (friendly or enemy) into an opposing piece.
	// y	(This is not an autonomous modifier, it will be used as a suffix with the meaning: any.)
	// z	This is the directional modifier for a reflection; useful for the definition of zig-zag lines, or reflecting bishops.
	var table = {
		a: "all",
		b: "backwards",
		c: "capture",
		cc: "captureFriendly",
		cy: "captureAny",
		d: "independant",
		e: "enPassant",
		ee: "enPassantOnly",
		f: "forward",
		g: "leaping",
		h: "halfling",
		i: "initial",
		ii: "initialDecayable",
		j: "jumping",
		jj: "jumpingFriendly",
		jy: "jumpingAny",
		k: "noCheck",
		kk: "noCheckmate",
		l: "left",
		m: "move",
		n: "nonJumping",
		o: "cylindrical",
		oo: "torus",
		p: "hop",
		pp: "hopMultiple",
		r: "right",
		s: "sidewards",
		t: "turn",
		tt: "noTurn",
		u: "unblocked",
		v: "vertical",
		w: "swap",
		ww: "swapFriendly",
		wy: "swapAny",
		x: "flip",
		xx: "flipFriendly",
		xy: "flipAny",
		z: "zigzag"
	}

	if (table[modifier]) {
		return table[modifier];
	} else {
		throw new Error("Could not match Modifier \"" + modifier + "\"")
	}
}

function Amalgamated(amalgamated, result) {
	// Checks for non-existent pairs and converts them into the correct DirectionalModifier (Example: (lr) becomes s). This doesn't cause an error but adds a warning
	if (amalgamated.length != 2) { throw new Error("Almagamated " + amalgamated + " doesn't contain exactly two DirectionalModifiers") }

	var modification = {};

	var table = {
		l: { r: "s", s: "l" },
		r: { s: "r" },
		f: { b: "v", v: "f" },
		b: { v: "b" }
	}

	var symbol1 = amalgamated[0], symbol2 = amalgamated[1];

	var redundancy = table[symbol1][symbol2] || table[symbol2][symbol1];

	if (redundancy) {
		result = addWarning(result, "Amalgamated \"" + amalgamated + "\" was redundant, converted into \"" + redundancy + "\"");
		modification.modifier = Modifier(redundancy, result);
	} else {
		var directionalModifier1 = Modifier(symbol1, result);
		var directionalModifier2 = Modifier(symbol2, result);

		modification.modifier = directionalModifier1 + "/" + directionalModifier2;
		modification.amalgamated = [directionalModifier1, directionalModifier2];
	}

	return modification;
}

function Condition(condition, result) {
	// <Condition>           ::= '/' ( <PieceSet> | <PieceLetter> ) ( <BoardRange> | <Square> ) '/'  ; Added a ? after ( <BoardRange> | <Square> ) since it isn't mandatory
	var match = condition.match(/^\/((?<PieceSet>{[+\-#*$%&A-Za-z0-9:!^]+})|(?<PieceLetter>[A-Za-z]|:[A-Za-z][A-Za-z0-9]?[A-Za-z0-9]?:))((?<BoardRange>\[[#.+*:\-^a-zA-H0-9,]+\])|(?<Square>[0-9a-zA-H]+))?\/$/);

	if (!match) { throw new Error("Could not match the Condition \"" + condition + "\"") }

	var cond = {};
	if (match.groups.PieceSet) cond.pieceSet = PieceSet(match.groups.PieceSet, result);
	if (match.groups.PieceLetter && !result.error) cond.pieceSet = { pieces: [ PieceLetter(match.groups.PieceLetter, result) ] };
	if (match.groups.BoardRange && !result.error) cond.range = BoardRange(match.groups.BoardRange, result);
	if (match.groups.Square && !result.error) cond.range = [ Square(match.groups.Square, result) ];

	return cond;
}

module.exports = exports = {MBN}
