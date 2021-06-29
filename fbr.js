/*
From http://ccif.sourceforge.net/formal-board-rules.html:
<FBR>             ::= <Rule> <Prefix>? <SeqNumber>? <PieceSet>? <BoardRange>?
                      ( '=' <Attribute> ( ',' <Attribute> )* )? ;
<PieceSet>        ::= '{' '!'? '^'? <PieceIdentifier>* '}'
<PieceIdentifier> ::= ('+' | '-' | '#' | '*')? <PieceLetter>
<PieceLetter>     ::= [A-Z] | ':' [A-Z] [A-Za-z0-9]? [A-Za-z0-9]? ':'
<BoardRange>      ::= '[' '^'? <CompoundRange> ']' ;
<CompoundRange>   ::= <SingleRange> ( ',' <SingleRange> )* ;
<SingleRange>     ::= <FileRange> | <RankRange> | <SquareRange> ;
<FileRange>       ::= <File> ( '-' <File> ) ;
<RankRange>       ::= <Rank> ( '-' <Rank> ) ;
<SquareRange>     ::= <FileRange> <RankRange> ;
<File>            ::= <Number> ;
<Rank>            ::= [a-z] ;
<Number>          ::= [0-9]+ ;
<Prefix>          ::= [+-#*$%&] ;
<SeqNumber>       ::= '<' <Number> '>' ;
*/

const {PieceSet, PieceIdentifier, PieceLetter, BoardRange, CompoundRange, SingleRange, FileRange, RankRange} = require("./definitions.js")
const rules = {
	alice: { attributes: { "3D": {}, "4D": {}, classic: {} } },
	andernach: {},
	announcement: { pieceSet: true, boardRange: true, announcementMust:true, attributes: { pieces: { pieceSet: { optional: true } } } }, // TODO: Add announcement to the FBR definition
	antiroyal: { pieceSetMust: true },
	atomic: { pieceSetMust: PieceSet("{^P}") },
	avalanche: { attributes: { balance: {} } },
	benedict: {},
	bouncing: { pieceSetMust: PieceSet("{B}") },
	bughouse: {}, // NO DEFINITIONS ON THE SITE FOR THE REPLACEMENT
	burner: { prefixMust: true, seqNumber: true, pieceSet: true },
	cheshire: { pieceSetMust: PieceSet("{X}") },
	conversion: { prefixMust: true, attributes: { capture: {}, move: {} } },
	cylindric: { attributes: { wrongrook: {}, null: {} } },
	diagonals: { attributes: { dark: {}, light: {} }, attributesMust: true }, // DEFAULT RULE: diagonals=dark,light
	difficulttrading: { attributes: { minor: { pieceSet: {} }, royal: {} }, pieceSetMust: PieceSet("{L}") },
	direction: { cardinalMust: true, boardRangeMust: true }, // TODO: Add cardinal support (Maybe general support for any supplement? Hard to do with regexes)
	draw: { attributes: { repetition: { amount: { default: 3 } }, stalemate: {} } }, // DEFAULT RULE: draw=repetition(3). There is a mistake on the site saying stalemate is the one with the amount as argument
	drop: { require: [ [ "bughouse", "holding" ] ], pieceSet: true, boardRange: true, attributes: { captured: { pieceSet: {} }, immediate: {}, nocheck: {}, nomate: {}, withattack: {} } }, // From the site for "immediate": "TODO: who is placing the piece, the opponent, or the enemy?". The property require ANDs all its values, and each of its values ORs their values. In this case, it leads to: holding OR bughouse
	freezer: { prefixMust: true, seqNumber: true, pieceSet: true, attributes: { attackers: { amount: {} }, capture: {}, checking: {}, move: {}, single: { pieceSet: {} }, suicide: {} } },
	gating: { boardRange: true, pieceSet: true, attributes: { ordered: {} } },
	hill: { boardRangeMust: true, pieceSet: true, attributes: { balance: {}, fill: {}, pass: { boardRange: {} } } },
	holding: { pieceSet: true, boardRange: true, attributes: { demote: { pieceSet: { optional: true }, prefix: { default: "-" }, exclude: [ "either" ] }, either: {}, notflip: {}, pocket: {}, promote: { prefix: { default: "+" } }, share: {} } },
	loss: { attributes: { perpetualcheck: { amount: { default: 3 } }, repetition: { amount: { default: 3 } }, stalemate: {} } },
	magnetic: {}, // NO DEFINITIONS ON THE SITE FOR THE REPLACEMENT, SUPPOSED IMPOSSIBLE (no automatic movements)
	mirror: { attributes: { vertical: {}, horizontal: {} } }, // DEFAULT RULE: mirror=vertical
	monster: {},
	multicapture: { attributes: { completed: { exclude: [ "immediate" ] }, immediate: {} }, attributesMust: Attributes("completed", { completed: {} }) },
	muskeeter: {}, // NO DEFINITIONS ON THE SITE FOR THE REPLACEMENT
	mustcapture: { pieceSet: true, attributes: { compulsory: {}, most: { pieceValues: { optional: true } }, multiple: {} } },
	nonrepeating: { pieceSet: true, attributes: { check: {}, never: {} } },
	pieces: { pieceSet: true, prefix: true, seqNumber: true, attributes: { avoidsamecolored: { amount: {} }, cannotbechecked: {}, consecutive: { amount: {} }, draw: {}, extinction: {}, file: { amount: {} }, holding: { amount: {} }, immovable: { amount: { optional: true } }, impartial: {}, maxcaptures: { amount: {} }, morethan: { amount: {} }, minimum: { amount: {} }, neutral: {}, overall: { amount: {} }, sum: { amount: {} }, taboo: { pieceSet: true }, total: { amount: {} }, transparent: {}, win: {} }, attributesMust: {} }, // Holy crap this rule has a lot of attributes
	pincher: { prefixMust: true, pieceSet: true },
	progressive: { attributes: { english: {}, italian: {}, moderate: {}, scotish:{} }, attributesMust: Attributes("italian", { italian: {} }) }, // NO DEFINITIONS ON THE SITE FOR THE REPLACEMENT, SUPPOSED IMPOSSIBLE (missing loops to have variable number of steps)
	protector: { prefixMust: true, seqNumber: true },
	promotion: { prefixMust: "+", boardRangeMust: [ "h" ], pieceSet: true, attributes: { available: {}, capture: { pieceSet: { optional: true }, negatable: {} }, captures: {}, castle: { pieceSet: {} }, continue: {}, demote: { requireAttribute: [ "origin" ], prefix: { default: "-" } }, enter: { pieceSet: { optional: true } }, entersuspend: { pieceSet: { optional: true } }, enpassant: {}, leave: { pieceSet: { optional: true } }, move: { pieceSet: { optional: true } }, "move*": { pieceSet: { optional: true } }, notforced: {}, null: {}, once: {}, optional: {}, origin: {}, setup: { pieceSet: { optional: true } }, stack: { pieceSet: { optional: true } }, suspend: {}, swap: { pieceSet: { optional: true }, negatable: {} }, warp: { requireRule: ["warp"] } } }, //DEFAULT RULE: promotion+=enter{P}. Also, new record for most attributes
	royal: { pieceSetMust: PieceSet("{K}"), boardRange: true, attributes: { evasefacing: {}, bare: {}, baremove: {}, castle: { pieceSet: { default: PieceSet("{R}") } }, checkmated: {}, expose: { amount: { optional: true } }, maxchecks: { amount: {} }, mustevase: {}, noperpetualcheck: {}, passover: {}, solely: {}, suicide: {}, taboo: {}, untilcaptured: {}, virginzone: { boardRange: {} } } },
	stalemate: { attributes: { draw: { exclude: [ "invalid", "loss", "skip", "win" ] }, invalid: { exclude: [ "loss", "skip", "win" ] }, loss: { exclude: [ "skip", "win" ] }, skip: { exclude: [ "win" ] }, win: {} }, attributesMust:true }, // DEFAULT RULE: stalemate=draw
	stopifchecking: {},
	stymizer: { prefixMust: true, seqNumber: true },
	swap: { pieceSet: true, attributes: { demote: { prefix: { default: "-" } }, promote: { prefix: { default: "+" } } } },
	swapping: {},
	switching: { attributes: { notincheck: {}, excluderoyals: {} } },
	torus: { attributes: { spacious: {}, wrongrook: {}, null: {} } },
	turn: { pieceSet: true, seqNumber: true, prefix: true, attributes: { achievable: {}, again: {}, alter: {}, balance: {}, castling: {}, avalanche: {}, check: {}, compulsory: {}, dontcross: {}, enpassant: {}, optional: {}, untilcapture: {} } }, // POTENTIAL DEFAULT RULE: turn=enpassant
	warp: { attributes: { start: { amount: {} } } },
	win: { attributes: { mostpoints: { amount: {} }, stalemate: {} }, attributesMust: true }, // Added the requirement for an attribute, otherwise the rule doesn't make sense
	zone: { boardRangeMust: true, attributesMust: true, pieceSet: true, attributes: { captureOnly: {}, dontcross: {}, hole: {}, river: {} } }
}

function FBR(description) {
	// <FBR>             ::= <Rule> <Prefix>? <SeqNumber>? <PieceSet>? <BoardRange>? ( '=' <Attribute> ( ',' <Attribute> )* )? ;
	var result = {};
	var match = description.match(/^(?<Negation>!)?(?<Rule>\S+?)(?<Prefix>[+\-#*$%&])?(?<SeqNumber><[0-9]+>)?(?<PieceSet>{[+\-#*$%&A-Za-z0-9:^!]+})?(?<BoardRange>\[[\-^a-zA-H0-9,]+\])?(=(?<Attributes>\S+))?$/);

	if (!match) { throw new Error("Could not match the FBR notation \"" + description + "\"") }

	[result.rule, allows] = Rule(match.groups.Rule, result);
	if (match.groups.Prefix) if (!allows.prefix && !allows.prefixMust) { throw new Error("Rule \"" + result.rule + "\" does not accept a Prefix") } else { result.prefix = match.groups.Prefix; }
	if (match.groups.SeqNumber) if (!allows.seqNumber && !allows.seqNumberMust) { throw new Error("Rule \"" + result.rule + "\" does not accept a SeqNumber") } else { result.seqNumber = match.groups.SeqNumber.slice(1, 2); }
	if (match.groups.PieceSet) if (!allows.pieceSet && !allows.pieceSetMust) { throw new Error("Rule \"" + result.rule + "\" does not accept a PieceSet") } else { result.pieceSet = PieceSet(match.groups.PieceSet, result); }
	if (match.groups.BoardRange) if (!allows.boardRange && !allows.boardRangeMust) { throw new Error("Rule \"" + result.rule + "\" does not accept a BoardRange") } else { result.boardRange = BoardRange(match.groups.BoardRange, result); }
	if (match.groups.Attributes) if (!allows.attributes) { throw new Error("Rule \"" + result.rule + "\" does not accept Attributes") } else { result.attributes = Attributes(match.groups.Attributes, allows.attributes, result); } // In the case of attributes, there is never an attributeMust all alone, as you still need to define which attributes are allowed

	// Requirements and defaults
	if (!result.prefix && allows.prefixMust) if (allows.prefixMust != true) { result.prefix = allows.prefixMust } else { throw new Error("Rule \"" + result.rule + "\" requires a Prefix"); }
	if (!result.seqNumber && allows.seqNumberMust) if (allows.seqNumberMust != true) { result.seqNumber = allows.seqNumberMust } else { throw new Error("Rule \"" + result.rule + "\" requires a SeqNumber"); }
	if (!result.pieceSet && allows.pieceSetMust) if (allows.pieceSetMust != true) { result.pieceSet = allows.pieceSetMust } else { throw new Error("Rule \"" + result.rule + "\" requires a PieceSet"); }
	if (!result.boardRange && allows.boardRangeMust) if (allows.boardRangeMust != true) { result.boardRange = allows.boardRangeMust } else { throw new Error("Rule \"" + result.rule + "\" requires a BoardRange"); }
	if (!result.attributes && allows.attributesMust) if (allows.attributesMust != true) { result.attributes = allows.attributesMust } else { throw new Error("Rule \"" + result.rule + "\" requires Attributes"); }

	return result;
}

function Rule(rule, result) {
	if (!rules[rule]) throw new Error("Rule \"" + rule + "\" does not exist")

	return [rule, rules[rule]];
}

function Attributes(attributes, allows, result = {}) {
	res = {}

	var match = attributes.matchAll(/(?<Attribute>[a-z]+)(?<Prefix>[+\-#*$%&])?(?<Amount>\([0-9]+\))?(?<PieceSet>{[+\-#*$%&A-Za-z0-9:^!]+})?(?<BoardRange>\[[\-^a-zA-H0-9,]+\])?/g)

	if (!match) { throw new Error("Could not match the Attributes notation \"" + attributes + "\"") }

	for (attribute of match) {
		name = attribute.groups.Attribute
		if (allows[name]) {
			object = res[name] = {}

			if (attribute.groups.Prefix) if (!allows[name].prefix) { throw new Error("Attribute \"" + name + "\" does not accept a Prefix") } else { object.prefix = attribute.groups.Prefix; }
			if (attribute.groups.Amount) if (!allows[name].amount) { throw new Error("Attribute \"" + name + "\" does not accept an Amount") } else { object.amount = Number(attribute.groups.Amount.slice(1,-1)); }
			if (attribute.groups.PieceSet) if (!allows[name].pieceSet) { throw new Error("Attribute \"" + name + "\" does not accept a PieceSet") } else { object.pieceSet = PieceSet(attribute.groups.PieceSet, result); }
			if (attribute.groups.BoardRange) if (!allows[name].boardRange) { throw new Error("Attribute \"" + name + "\" does not accept a BoardRange") } else { object.boardRange = BoardRange(attribute.groups.BoardRange, result); }

			// Requirements and defaults
			if (!object.prefix && allows[name].prefix) if (allows[name].prefix.default) { object.prefix = allows[name].prefix.default } else if (!allows[name].prefix.optional) { throw new Error("Attribute \"" + name + "\" requires a Prefix") }
			if (!object.amount && allows[name].amount) if (allows[name].amount.default) { object.amount = allows[name].amount.default } else if (!allows[name].amount.optional) { throw new Error("Attribute \"" + name + "\" requires a Amount") }
			if (!object.pieceSet && allows[name].pieceSet) if (allows[name].pieceSet.default) { object.pieceSet = allows[name].pieceSet.default } else if (!allows[name].pieceSet.optional) { throw new Error("Attribute \"" + name + "\" requires a PieceSet") }
			if (!object.boardRange && allows[name].boardRange) if (allows[name].boardRange.default) { object.boardRange = allows[name].boardRange.default } else if (!allows[name].boardRange.optional) { throw new Error("Attribute \"" + name + "\" requires a BoardRange") }
		} else {
			throw new Error("Rule \"" + result.rule + "\" does not accept \"" + name + "\" as an attribute")
		}
	}

	return res;
}

module.exports = exports = {FBR}
