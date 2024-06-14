//

start
  = type:Type [ \t]+ description:Description { return { type, description } }
  / description:Description { return { type: null, description } }

Type
  = "{" _ name:Identifier "}" { return { name } }

Description
  = description:.* { return description.join('') }

Identifier
  = head:[a-zA-Z_]+[a-zA-Z0-9_]* { return head.join('') }
  / head:String { return head }
 
String
  = '"' chars:DoubleStringCharacter* '"' { return chars.join('') }
  / "'" chars:SingleStringCharacter* "'" { return chars.join('') }

DoubleStringCharacter
  = !('"' / "\\") char:. { return char}
  / "\\" sequence:EscapeSequence { return sequence}

SingleStringCharacter
  = !("'" / "\\") char:. { return char}
  / "\\" sequence:EscapeSequence { return sequence}

EscapeSequence
  = "'"
  / '"'
  / "\\"
  / "b"  { return "\b" }
  / "f"  { return "\f" }
  / "n"  { return "\n" }
  / "r"  { return "\r" }
  / "t"  { return "\t" }
  / "v"  { return "\x0B"}

_ "whitespace"
  = [ \t]*