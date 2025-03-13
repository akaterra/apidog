// @apiParamValue [(group)] [{type=type}] value [description]

start
  = group:Group? _ type:Type? _ value:Any _ description:Rest? { return { group, type, value, description } }

Group
  = "(" _ name:GroupName _ ")" { return { name } }
  
GroupName
  = head:GroupNameCharacter+ { return head.join('') }

GroupNameCharacter
  = !")" char:. { return char }

Type
  = "{" _ name:Any _ "}" { return { name } }

Rest
  = head:.* { return head.join('') || null }

AtLeastOneChar
  = head:.+ { return head.join('') || null }

Any
  = head:[a-zA-Z0-9_\-!@#$%^&]+ { return head.join('') }
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