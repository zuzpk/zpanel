/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client"
import { API_URL, APP_NAME, LocalDB, REDIRECT_AFTER_OAUTH } from '@/config';
import { AppStore } from '@/store';
import Style from '@/ui';
import { useStore } from '@zuzjs/store';
import { Box, Button, dynamicObject, Form, FORMVALIDATION, Input, Password, Sheet, SheetHandler, Size, Text, TRANSITION_CURVES, TRANSITIONS, useDB, useMounted, Variant } from '@zuzjs/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Signup : React.FC = (_props) => {

    const mounted = useMounted()
    const anim = useMemo(() => ({
        transition: TRANSITIONS.SlideInTop,
        curve: TRANSITION_CURVES.Spring,
        when: mounted,
        duration: 0.5
    }), [mounted])
    const { loading, ID, dispatch } = useStore<typeof AppStore.User>(`user`)
    const router = useRouter();
    const { insert } = useDB(LocalDB.You)
    const toast = useRef<SheetHandler>(null)

    const onSuccess = useCallback((resp: dynamicObject) => {
        if ( resp.u ){
            insert(`you`, resp.u)
            dispatch({ ...resp.u }).then(() => router.push(`${REDIRECT_AFTER_OAUTH}?v=${Date.now()}`))
        }
        else{
            router.push(`/u/verify/${resp.token}/${encodeURIComponent(resp.email)}`)
        }
    }, [])

    const onFailed = useCallback((err: dynamicObject) => {
        toast.current?.error(err.message)
      }, [])

    useEffect(() => {
        if ( !loading && ID ){
            router.push(`${REDIRECT_AFTER_OAUTH}?_=${Date.now()}`)
        }
        document.title = `Sign Up`
    }, [])

    return <Box as={`minH:calc[100vh - 70px] flex aic jcc`}>
        <Form 
            name={`signup`}
            action={`${API_URL}u/signup`}
            onSuccess={onSuccess}
            onError={onFailed}
            errors={{
                nm: `Name is required`,
                em: `Valid email is required`,
                psw: `Password is required`,
                rpsw: `Passwords do not match`
            }}
            as={`flex aic jcc cols w:400 gap:12`}>
            
            <Text fx={{ ...anim, delay: 0.1 }} as={`s:30 b:900 mb:30`}>Sign up for {APP_NAME}</Text>

            <Input name={`nm`} variant={Variant.Medium} placeholder={`Name`} fx={anim} required />
            <Input name={`em`} variant={Variant.Medium} placeholder={`Email`} fx={{ ...anim, delay: 0.1 }} required with={FORMVALIDATION.Email} />
            <Password name={`psw`} variant={Variant.Medium} placeholder={`Password`} fx={{ ...anim, delay: 0.2 }} required />
            <Password name={`rpsw`} variant={Variant.Medium} placeholder={`Repeat Password`} fx={{ ...anim, delay: 0.3 }} required with={`${FORMVALIDATION.MatchField}@psw`} />

            <Button type={`submit`} size={Size.Medium} as={`w:100%! mt:25`} fx={{ ...anim, delay: 0.35 }}>Create Account</Button>

            <Text as={`mv:35`} fx={{ ...anim, delay: 0.4 }}>By clicking "Create account", you agree to the <Link className={Style.Link} href={`/help/terms` as any}>{APP_NAME} TOS</Link> and <Link className={Style.Link} href={`/help/privacy` as any}>Privacy Policy.</Link></Text>
            <Text fx={{ ...anim, delay: 0.45 }}>Already have an account? <Link className={Style.Link} href={`/u/signin`}>Sign in here</Link></Text>

        </Form>
        <Sheet ref={toast} />
    </Box>
}

export default Signup;