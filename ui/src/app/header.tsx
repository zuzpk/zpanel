/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import { APP_NAME, APP_VERSION, LocalDB } from "@/config"
import { Store } from "@/store"
import { User } from "@/types"
import { withPost } from "@zuzjs/core"
import { useStore } from "@zuzjs/store"
import { Avatar, Box, Search, Button, ColorScheme, ContextMenu, ContextMenuHandler, css, Icon, Image, SheetHandler, Spinner, Text, TRANSITION_CURVES, TRANSITIONS, useContextMenu, useDB, useDelayed, Variant } from "@zuzjs/ui"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useRef } from "react"

const Header = () => {

    const me = useStore<User>(Store.User)
    const toast = useRef<SheetHandler>(null)
    const mounted = useDelayed()
    const pathname = usePathname()
    const router = useRouter()
    const userMenu = useRef<ContextMenuHandler>(null)
    const userMenuParent = useRef<HTMLDivElement>(null)
    const { show: showUserMenu } = useContextMenu(userMenu);
    const { remove } = useDB(LocalDB.You)

    const signOut = useCallback(() => {
        me.dispatch({ loading: true });
        withPost(`/@/u/signout`, {})
        .then((_resp) => {
            console.log(`med`, me.ID!)
            remove(`you`, me.ID!)
            me.dispatch({ loading: false, ID: null, oid: null })
            if ( pathname != `/` ){
                router.push(`/?so=${Date.now()}`)
            }
        })
        .catch((err) => {
            toast.current!.error(err.message || `Failed to signout. Please try again.`)
            me.dispatch({ loading: false });
        })
    }, [me])

    if ( me.loading || me.ID == -1 ) return null

    return <Box as={[
        `header flex aic p:30,25 rel zIndex:99 &ph(p:20) h:60 bg:$body`,
    ]}>
        
        <Box as={`flex aic jcc flex:1`}>
            <Search 
                variant={Variant.Medium}
                placeholder={`Search`} />
        </Box>
        <Box as={`flex aic jce flex:1`}>

            { me.loading ? <Spinner /> : 
                me.ID ? <>
                    <Box as={`flex aic gap:10`} ref={userMenuParent}>
                        <Button onClick={(ev) => showUserMenu(ev as any)} as={`bg:transparent! c:$text flex aic gap:6`}>
                            <Avatar alt={me.nm} />
                            <Icon name={`arrow-down`} as={`c:$text s:10`} />
                        </Button>
                    </Box>
                    <ContextMenu
                    items={[
                        { label: `Signout`, onSelect: signOut }
                    ]}
                    ref={userMenu} 
                    offsetY={10}
                    offsetX={20}
                    parent={userMenuParent.current!} />
                </>
            : <>
                <Link href={{ pathname: "/u/signin" }} className={css(`ml:20 mr:1 tdn p:4,10 border:1,$button-link-border,solid s:16 r:20,0,0,20 bg:$button-link &hover(bg:$primary border:1,$primary,solid c:fff scale:1.1) anim:0.1s`)}>Sign in</Link>
                <Link href={{ pathname: "/u/signup" }} className={css(`tdn p:4,10 border:1,$button-link-border,solid s:16 r:0,20,20,0 bg:$button-link &hover(bg:$primary border:1,$primary,solid c:fff scale:1.1) anim:0.1s`)}>Create Account</Link>
            </>}
            <ColorScheme as={`ml:20`} />

        </Box>
    </Box>

}

export default Header