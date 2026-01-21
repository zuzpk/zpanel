import { withoutSeperator } from "@/lib"
import zorm, { Settings } from "@/zorm"
import { _, dynamic } from "@zuzjs/core"
import de from "dotenv"
import multer from "multer"
import path from "path"
import { v4 as uuidv4 } from "uuid"

de.config()

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, path.join(__dirname, `../../storage/cache`))
    },
    filename: function(req, file, cb){
        const ext = path.extname(file.originlname).toLowerCase()
        cb(null, `${Date.now()}-${uuidv4()}${ext}`)
    }
})

export async function Cog(okey: string, defaultValue?: boolean | string | number): Promise<boolean | string | number | undefined>;
export async function Cog(okey: string[], defaultValue?: boolean | string | string[] | number | {}): Promise<Record<string, boolean | string | number> | undefined>;
export async function Cog(okey: string | string[], defaultValue?: boolean | string | string[] | number | {}): Promise<any> {
    let query = zorm.find(Settings)
    if ( _(okey).isArray() ){
        (okey as string[]).forEach((ok, i) => {
            console.log(`-`, ok)
            if ( i == 0 )
                query.where({ okey: ok })
            else
                query.or({ okey: ok })
        })
    }
    else query.where({ okey: okey as any })

    const _value = (val : string) => {
        return [`1`, `0`].includes(val) ? 
            (val == `1`) 
                : val.includes(process.env.SEPERATOR!) ? withoutSeperator(val) : val
    }

    const get = await query
    if ( get.hasRows ){
        if ( get.rows && get.rows.length > 1 ){
            const vals : dynamic = {}
            get.rows.forEach((r) => {
                vals[r.okey] = _value(r.value)
            })
            return vals
        }
        else return _value(get.row.value)
    }
    else if ( typeof okey === `string` && defaultValue && !_(okey).isArray() ){
        await zorm.create(Settings).with({
            okey,
            value: `boolean` === typeof defaultValue ? String(defaultValue == true ? 1 : 0) : String(defaultValue)
        })
        return defaultValue
    }
}

export const uploader = multer({ storage })