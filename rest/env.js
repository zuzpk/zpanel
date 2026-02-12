const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, '.env')
const bases = [ `user`, `password`, `name`, `host`, `port` ]

if ( fs.existsSync( envPath ) ){

    const raw = fs.readFileSync( envPath, `utf8` )
    const params = []
    const base = {}
    const lines = []
    raw.split(`\n`)
        .forEach(line => {
            if ( line.startsWith (`DB_`) ){
                const [ k, v ] = line.replace(`DB_`, ``).split(`=`)
                if ( bases.includes( k.toLowerCase() )){
                    base[k.toLowerCase()] = v.replace(/^"|"$/g, ``)
                }
                else{
                    params.push( `${k.toLowerCase()}=${v}` )
                }
            }
            if ( line.trim() != `` && !line.startsWith( `DATABASE_URL` ) ){
                lines.push(line)
            }
        })

    const url = `DATABASE_URL="mysql://${base.user}:${encodeURIComponent(base.password)}@${base.host}:${base.port}/${base.name}?${params.join(`&`)}"`

    fs.writeFileSync( envPath, `${lines.join(`\n`)}\n\n${url}`, {
        encoding: `utf8`
    })

    console.log(`.env generated`)

}
else{
    console.error(`.env does not exist`)
}