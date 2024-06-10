// @apiParam [(group)] [{type=type}] [field[=defaultValue]] description

start
  = group:Group? _ type:Type? _ field:Field description:Description? { return { group, type, field, description }  }

Group
  = "(" _ name:Identifier _ ")" { return { name } }

Type
  = "{" _ name:Identifier modifiers:TypeModifiers* _ constraints:TypeConstraints? _ e:TypeEnum? "}" { return { name, modifiers, ...constraints, enum: e }  }

TypeModifiers
  = ":" name:Identifier list:"[]"* { return { name, list: list.length } }
  / list:"[]"+ { return { name: null, list: list.length } }

TypeConstraints
  = "{" _ min:NumberOrNothing _ delim:("-" / "..") _ max:NumberOrNothing _ "}" { return { min, max, isNumeric: delim === '-' } }

TypeEnum
  = "=" head:(Any)|1..,","| { return head }

Field
  = "[" _ name:Path defaultValue:FieldDefaultValue? "]" { return { name, defaultValue: defaultValue ?? undefined, isRequired: false } }
  / name:Path defaultValue:FieldDefaultValue? { return { name, defaultValue: defaultValue ?? undefined, isRequired: true } }

FieldDefaultValue
  = "=" head:Any { return head } 

Description
  = [ \t]+ description:.* { return description.join('') }

Identifier
  = head:[a-zA-Z_]+[a-zA-Z0-9_]* { return head.join('') }
  / head:String { return head }

Path
  = head:Any tail:PathTail* { return head + tail }

PathTail
  = "[" head:Any* "]" tail:PathTail* { return '[' + head + ']' + tail }
  / "." head:Any tail:PathTail* { return '.' + head + tail }

Any
  = head:[a-zA-Z0-9_]+ { return head.join('') }
  / String

Number
  = sign:"-"? part:[1-9]+[0-9]* { return parseInt(part.join('')) * (sign === '-' ? -1 : 1) }
  / "0" { return 0 }

NumberOrNothing
  = Number
  / "" { return null }
 
String
  = '"' chars:DoubleStringCharacter* '"' { return chars.join(''); }
  / "'" chars:SingleStringCharacter* "'" { return chars.join(''); }

DoubleStringCharacter
  = !('"' / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

SingleStringCharacter
  = !("'" / "\\") char:. { return char; }
  / "\\" sequence:EscapeSequence { return sequence; }

EscapeSequence
  = "'"
  / '"'
  / "\\"
  / "b"  { return "\b";   }
  / "f"  { return "\f";   }
  / "n"  { return "\n";   }
  / "r"  { return "\r";   }
  / "t"  { return "\t";   }
  / "v"  { return "\x0B"; }

_ "whitespace"
  = [ \t]*