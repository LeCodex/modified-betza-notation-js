function Identifier(identifier, result) {
	// <Identifier>          ::= ( '@' <MacroIdentifier> | <PieceIdentifier> ) <Suffix> <BoardIdentifier>?  ; Added the possibility for a comment right after the piece definition
	var match = identifier.match(/^(@(?<MacroIdentifier>[A-Za-z0-9:]+)|(?<PieceIdentifier>[+\-#*$%&A-Za-z0-9:]+))(?<Suffix><[A-Za-z]+>)?(?<BoardIdentifier><[<>;0-9*,]+>)?(\|.*\|)?$/);

	if (!match) { throw new Error("Could not match the Identifier \"" + identifier + "\"") }

	if (match.groups.MacroIdentifier) result = MacroIdentifier(match.groups.MacroIdentifier, result);
	if (match.groups.PieceIdentifier && !result.error) result = PieceIdentifier(match.groups.PieceIdentifier, result);
	if (match.groups.Suffix && !result.error) result = Suffix(match.groups.Suffix, result);
	if (match.groups.BoardIdentifier && !result.error) result = BoardIdentifier(match.groups.BoardIdentifier, result);

	return result;
}

function MacroIdentifier(macroIdentifier, result) {
	// <PieceIdentifier>     ::= [+-#*$%&]? <PieceLetter>
	var match = macroIdentifier.match(/^[A-Za-z]$|^:[A-Za-z][A-Za-z0-9]?[A-Za-z0-9]?:$/);

	if (!match) { throw new Error("Could not match the MacroIdentifier \"" + macroIdentifier + "\"") }

	result.macro = match[0];
	return result;
}

function PieceIdentifier(pieceIdentifier, result) {
	// <PieceIdentifier>     ::= [+-#*$%&]? <PieceLetter>
	var match = pieceIdentifier.match(/^([+\-#*$%&])?(?<PieceLetter>[A-Za-z0-9:]+)$/);

	if (!match) { throw new Error("Could not match the PieceIdentifier \"" + pieceIdentifier + "\"") }

	if (match[1]) result.prefix = match[1];
	result.piece = PieceLetter(match.groups.PieceLetter, result);

	return result;
}

function PieceLetter(pieceLetter, result) {
	// <PieceLetter>         ::= [A-Za-z] | ':' [A-Za-z] [A-Za-z0-9]? [A-Za-z0-9]? ':'
	if (/^[A-Za-z]$|^:[A-Za-z][A-Za-z0-9]?[A-Za-z0-9]?:$/.test(pieceLetter)) {
		return pieceLetter;
	} else {
		throw new Error("Could not match the PieceLetter \"" + pieceLetter + "\"")
	};
}

function Suffix(suffix, result) {
	// <Suffix>              ::= [A-Za-z0-9] [A-Za-z0-9]*  ; Updated to remove the numbers, since it causes issues with the recognition of the BoardIdentifier. Also added back the <>
	var match = suffix.match(/^<([A-Za-z][A-Za-z]*)>$/);

	if (!match) { throw new Error("Could not match the Suffix \"" + suffix + "\"") }

	result.suffix = match[1];
	return result;
}

function BoardIdentifier(boardIdentifier, result) {
	// <BoardIdentifier>     ::= <3dBoardIdentifier> | <4dBoardIdentifier>  ; Testing both options to see if either match.
	result = ThreeDBoardIdentifier(boardIdentifier, result);
	if (!result.threeDBoard) result = FourDBoardIdentifier(boardIdentifier, result);

	return result;
}

function ThreeDBoardIdentifier(threeDBoardIdentifier, result) {
	// <3dBoardIdentifier>   ::= '<' <BoardNumbers> '>' | '<' '<' <BoardNumbers> '>' '>'
	var match = threeDBoardIdentifier.match(/^<(?<BoardNumbers1>[0-9*,]+)>$|^<<(?<BoardNumbers2>[0-9*,]+)>>$/);

	if (!match) {
		result = addWarning(result, "Could not match 3dBoardIdentifier \"" + threeDBoardIdentifier + "\"");
		return result; // Didn't match the 3D board syntax but may match the 4D board one, so no errors
	}

	var numbers = BoardNumbers(match.groups.BoardNumbers1 ? match.groups.BoardNumbers1 : match.groups.BoardNumbers2);

	if (!numbers) {
		result = addWarning(result, "Could not match the Board Numbers of the 3dBoardIdentifier \"" + threeDBoardIdentifier + "\"");
		return result;
	}

	if (match.groups.BoardNumbers2) result.reflected3DBoard = true;
	result.threeDBoard = numbers;

	return result;
}

function FourDBoardIdentifier(fourDBoardIdentifier, result) {
	// <4dBoardIdentifier>   ::= <4dBoardIdentifier1> | <4dBoardIdentifier2>  ; Once again, testing both opetions
	result = FourDBoardIdentifier1(fourDBoardIdentifier, result);
	if (!result.fourDBoard) result = FourDBoardIdentifier2(fourDBoardIdentifier, result);

	return result;
}

function FourDBoardIdentifier1(fourDBoardIdentifier, result) {
	// <4dBoardIdentifier1>  ::= '<' <3dBoardIdentifier> ';' <3dBoardIdentifier> '>'
	var match = fourDBoardIdentifier.match(/^<(?<threeDBoardIdentifier1>[<>0-9*,]+);(?<threeDBoardIdentifier2>[<>0-9*,]+)>$/);

	if (!match) {
		result = addWarning(result, "Could not match 4dBoardIdentifier1 \"" + fourDBoardIdentifier + "\"");
		return result; // Didn't match the 4D board syntax but may match the 4D board one, so no errors
	}

	var result1 = ThreeDBoardIdentifier(match.groups.threeDBoardIdentifier1, {});
	var result2 = ThreeDBoardIdentifier(match.groups.threeDBoardIdentifier2, {});

	if (result1.warnings) result.warnings.push(...result1.warnings);
	if (result2.warnings) result.warnings.push(...result2.warnings);

	if (!result1.threeDBoard || !result2.threeDBoard) {
		result = addWarning(result, "Could not match the BoardNumbers of the 4dBoardIdentifier1 \"" + fourDBoardIdentifier + "\"");
		return result;
	}

	result.fourDBoard = [result1, result2];
	return result;
}

function FourDBoardIdentifier2(fourDBoardIdentifier, result) {
	// <4dBoardIdentifier2>  ::= '<' '<' <BoardNumbers> ';' <BoardNumbers> '>' '>'
	var match = fourDBoardIdentifier.match(/^<<(?<BoardNumbers1>[0-9*,]+);(?<BoardNumbers2>[0-9*,]+)>>$/);

	if (!match) { throw new Error("Could not match the BoardIdentifier \"" + fourDBoardIdentifier + "\"") } // Small issue: there is no way of knowing where the error as precisely as the other parts

	var numbers1 = BoardNumbers(match.groups.BoardNumbers1);
	var numbers2 = BoardNumbers(match.groups.BoardNumbers2);

	if (!numbers1 || !numbers2) { throw new Error("Could not match the BoardNumbers of the BoardIdentifier \"" + fourDBoardIdentifier + "\"") }

	result.fourDBoard = [ { threeDBoard: numbers1 }, { threeDBoard: numbers2 } ];
	result.reflected4DBoard = true;

	return result;
}

function BoardNumbers(boardNumbers) {
	// <BoardNumbers>        ::= '*' | <ListOfNumbers>  ; Since this is close enough to being a leaf in our parsing tree, this function will only return a list of the numbers it found
	var match = boardNumbers.match(/^\*$|^(?<ListOfNumbers>[0-9,]+)$/);

	if (!match) return null;

	return match.groups.ListOfNumbers ? ListOfNumbers(match.groups.ListOfNumbers) : "*";
}

function ListOfNumbers(listOfNumbers) {
	// <ListOfNumbers>       ::= <Number> (',' <Number>)*
	// Number                ::= [0-9]+
	if (!/^[0-9](?:,[0-9])*$/.test(listOfNumbers)) return null; // Could not match the format

	return [...listOfNumbers.matchAll(/[0-9]+/g)].map(e => e[0]);
}

function BoardRange(boardRange, result) {
	// <BoardRange>          ::= '[' '^'? <CompoundRange> ']'
	var match = boardRange.match(/^\[\^?(?<CompoundRange>[#.+*:\-a-zA-H0-9,]+)\]$/);

	if (!match) { throw new Error("Could not match the BoardRange \"" + boardRange + "\"") }

	return CompoundRange(match.groups.CompoundRange, result);
}

function CompoundRange(compoundRange, result) {
	// <CompoundRange>       ::= <SingleRange> ( ',' <SingleRange> )*
	var parsedRanges = [];
	if (!/^[#.+*:\-a-zA-H0-9]+(,[#.+*:\-a-zA-H0-9]+)*$/.test(compoundRange)) { throw new Error("Could not match the CompoundRange \"" + compoundRange + "\"") }

	var ranges = compoundRange.matchAll(/,(?<SingleRange1>[#.+*:\-a-zA-H0-9]+)|(?<SingleRange2>[#.+*:\-a-zA-H0-9]+)/g);

	if (!ranges) { throw new Error("Could not match the SingleRanges of the CompoundRange \"" + compoundRange + "\"") }

	for (var match of ranges) {
		var range = match.groups.SingleRange1 ? match.groups.SingleRange1 : match.groups.SingleRange2;

		var singleRange = SingleRange(range, result);

		if (result.error) return;

		parsedRanges.push(singleRange);
	}

	return parsedRanges;
}

function SingleRange(singleRange, result) {
	// <SingleRange>         ::= ( <FileRange> | <RankRange> | <SquareRange> ) <3dRange>? <4dRange>?  ; Added the missing ranges for edge, inner, threatened, unthreatened and unmoved squares
	// <SquareRange>         ::= <FileRange> <RankRange>
	var match = singleRange.match(/^(?<Edge>#)$|^(?<Inner>\.)$|^(?<Threatened>\+)$|^(?<Unthreatened>\*)$|^(?<Unmoved>:)$|^(?<FileRange>[a-z\-]+)?(?<RankRange>[0-9\-]+)?(?<ThreeDRange>[A-H\-]+)?(?<FourDRange>[1-8\-]+)?$/);

	if (!match) { throw new Error("Could not match the SingleRange \"" + singleRange + "\"") }

	if (match.groups.Edge) return CompoundRange("a-h1,a-h8,a1-8,h1-8", result);
	if (match.groups.Inner) return { file: ["b", "g"], rank: ["2", "7"] };
	if (match.groups.Threatened) return { threatened: true };
	if (match.groups.Unthreatened) return { unthreatened: true };
	if (match.groups.Unmoved) return { unmoved: true };

	var range = {};
	if (match.groups.FileRange) { range.file = FileRange(match.groups.FileRange, result); }
	if (match.groups.RankRange) { range.rank = RankRange(match.groups.RankRange, result); }
	if (!range.file && !range.rank) { throw new Error("Could not match the FileRange or RankRange or SquareRange of the SingleRange \"" + singleRange + "\"") }

	if (match.groups.ThreeDRange && !result.error) { range.threeDLevel = ThreeDRange(match.groups.ThreeDRange, result); }
	if (match.groups.FourDRange && !result.error) { range.fourDRow = FourDRange(match.groups.FourDRange, result); }

	if (!result.error) return range;
}

function FileRange(fileRange, result) {
	// <FileRange>           ::= <File> ( '-' <File> )?
	// <File>                ::= [a-z]  ; Swapped both File and Rank since this was wrong on the original form
	var match = fileRange.match(/^(?<File1>[a-z])(-(?<File2>[a-z]))?$/);

	if (!match) { throw new Error("Could not match the FileRange \"" + fileRange + "\"") }

	var file = [];
	file.push(match.groups.File1);
	if (match.groups.File2) file.push(match.groups.File2);

	return file;
}

function RankRange(rankRange, result) {
	// <RankRange>           ::= <Rank> ( '-' <Rank> )?
	// <Rank>                ::= <Number>
	var match = rankRange.match(/^(?<Rank1>[0-9]+)(-(?<Rank2>[0-9]+))?$/);

	if (!match) { throw new Error("Could not match the RankRange \"" + rankRange + "\"") }

	var rank = [];
	rank.push(match.groups.Rank1);
	if (match.groups.Rank2) rank.push(match.groups.Rank2);

	return rank;
}

function ThreeDRange(threeDRange, result) {
	// <3dRange>             ::= <3dLevel> ( '-' <3dLevel> )?
	// <3dLevel>             ::= [A-H]
	var match = threeDRange.match(/^(?<ThreeD1>[A-H]+)(-(?<ThreeD2>[A-H]+))?$/);

	if (!match) { throw new Error("Could not match the ThreeDRange \"" + threeDRange + "\"") }

	var threeDLevel = [];
	if (match.groups.ThreeD1) threeDLevel.push(match.groups.ThreeD1);
	if (match.groups.ThreeD2) threeDLevel.push(match.groups.ThreeD2);

	return threeDLevel;
}

function FourDRange(fourDRange, result) {
	// <4dRange>             ::= <4dRow> ( '-' <4dRow> )?
	// <4dRow>               ::= [1-8]
	var match = fourDRange.match(/^(?<FourD1>[1-8]+)(-(?<FourD2>[1-8]+))?$/);

	if (!match) { throw new Error("Could not match the FourDRange \"" + fourDRange + "\"") }

	var fourDRow = [];
	if (match.groups.FourD1) fourDRow.push(match.groups.FourD1);
	if (match.groups.FourD2) fourDRow.push(match.groups.FourD2);

	return fourDRow;
}

function PieceSet(pieceSet, result) {
	// <PieceSet>            ::= '{' '!'? '^'? <PieceLetter>* '}'
	var match = pieceSet.match(/^\{(?<Inverted>\^)?(?<ColorSensitive>!)?(?<PieceLetters>[A-Za-z0-9:]*)\}$/);

	if (!match) { throw new Error("Could not match the PieceSet \"" + pieceSet + "\"") }

	var pieces = match.groups.PieceLetters.matchAll(/[A-Za-z]|:[A-Za-z][A-Za-z0-9]?[A-Za-z0-9]?:/g);

	if (!pieces) { throw new Error("Could not match the Pieces of the PieceSet \"" + pieceSet + "\"") }

	var set = { pieces: [] };

	if (match.groups.ColorSensitive) set.colorSensitive = true;
	if (match.groups.Inverted) set.inverted = true;

	for (letter of pieces) {
		var piece = PieceLetter(letter[0], result);

		if (result.error) return;

		set.pieces.push(piece);
	}

	return set;
}

function Square(square, result) {
	// <Square>              ::= <File> <Rank> <3dLevel>? <4dRow>?  ; 3dLevel not 4dLevel
	var match = square.match(/^(?<File>[a-z])(?<Rank>[0-9]+)(?<ThreeDLevel>[A-H])?(?<FourDRow>[0-8]+)?$/);

	if (!match) { throw new Error("Could not match the Square \"" + square + "\"") }

	var range = {};
	if (match.groups.File) range.file = [ match.groups.File ];
	if (match.groups.Rank) range.rank = [ match.groups.Rank ];
	if (match.groups.ThreeDLevel) range.threeDLevel = [ match.groups.ThreeDLevel ];
	if (match.groups.FourDRow) range.fourDRow = [ match.groups.FourDRow ];

	return range;
}

module.exports = exports = {Identifier, MacroIdentifier, PieceIdentifier, PieceLetter, Suffix, BoardIdentifier, ThreeDBoardIdentifier, FourDBoardIdentifier, BoardNumbers, ListOfNumbers, BoardRange, CompoundRange, SingleRange, FileRange, RankRange, ThreeDRange, FourDRange, PieceSet, Square};
