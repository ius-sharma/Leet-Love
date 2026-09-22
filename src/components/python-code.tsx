/** Render authored Python as text tokens; never interpret it as markup. */
export function PythonCode({code}:{code:string}) {
 const tokens=code.split(/("[^"\n]*"|'[^'\n]*'|\b(?:def|for|in|return|while|if|else|not|and|or|True|False|None)\b|\b\d+(?:\.\d+)?\b|\b(?:range|len|max|min|int|float|set|enumerate)\b)/g);
 return <>{tokens.map((token,i)=>{const kind=/^["']/.test(token)?'string':/^(def|for|in|return|while|if|else|not|and|or|True|False|None)$/.test(token)?'keyword':/^\d/.test(token)?'number':/^(range|len|max|min|int|float|set|enumerate)$/.test(token)?'builtin':'';return kind?<span className={`python-${kind}`} key={i}>{token}</span>:token;})}</>;
}
