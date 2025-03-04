// @apiParamPrefix [{type}] [(group)] [title]

start
  = type:Type _ group:Group? __ title:Rest { return { type, group, title } }
  / title:Rest { return { type: null, title } }

Type
  = "{" _ name:Any "}" { return { name } }

Group
  = "(" _ name:GroupName _ ")" { return { name } }
  
GroupName
  = head:GroupNameCharacter+ { return head.join('') }

GroupNameCharacter
  = !")" char:. { return char }

Rest
  = head:.* { return head.join('') || null }

AtLeastOneChar
  = head:.+ { return head.join('') || null }

Any
  = head:[a-zA-Z0-9_-]+ { return head.join('') }
  / String
 
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
  
__ "whitespace"
  = [ \t]+