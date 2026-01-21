"use client"
import { APP_NAME, LocalDB, REDIRECT_AFTER_OAUTH } from '@/config';
import { AppStore } from '@/store';
import Style from '@/ui';
import { useStore } from '@zuzjs/store';
import { Box, Button, css, dynamicObject, Form, FORMVALIDATION, Input, Password, Sheet, SheetHandler, Text, TRANSITION_CURVES, TRANSITIONS, useDB, useMounted, Variant } from '@zuzjs/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Signin : React.FC = (_props) => {

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
        insert(`you`, resp.u)
        dispatch({ ...resp.u, loading: false }).then(() => router.push(`${REDIRECT_AFTER_OAUTH}?_=${Date.now()}`))
    }, [])

    const onFailed = useCallback((err: dynamicObject) => {
        toast.current?.error(err.message)
    }, [])

    useEffect(() => {
        if ( !loading && ID ){
            router.push(`${REDIRECT_AFTER_OAUTH}?_=${Date.now()}`)
        }
    }, [loading, ID])

    return <Box as={`minH:calc[100vh - 70px] flex aic jcc`}>
        <Form 
            name={`signin`}
            action={`/@/u/signin`}
            onSuccess={onSuccess}
            onError={onFailed}
            errors={{
                em: `Valid email is required`,
                psw: `Password is required`,
            }}
            as={`flex aic jcc cols w:400 gap:12`}>
            
            <Text fx={{ ...anim, delay: 0.1 }} as={`s:30 b:900 mb:30`}>Signin to {APP_NAME}</Text>

            <Input variant={Variant.Medium} name={`em`} placeholder={`Email`} fx={{ ...anim, delay: 0.1 }} required with={FORMVALIDATION.Email} />
            <Password variant={Variant.Medium} name={`psw`} placeholder={`Password`} fx={{ ...anim, delay: 0.2 }} required />
            
            <Button variant={Variant.Medium} type={`submit`} as={`w:100%! mt:25`} fx={{ ...anim, delay: 0.35 }}>Sign in</Button>

            <Text as={`mt:35`} fx={{ ...anim, delay: 0.4 }}><Link className={css(`${Style.Link} bold`)} href={`/u/recover`}>Forgot Password?</Link></Text>
            <Text fx={{ ...anim, delay: 0.45 }}>New here? <Link className={css(`${Style.Link} bold`)} href={`/u/signup`}>Create account</Link></Text>

        </Form>
        <Sheet ref={toast} />
    </Box>
}

export default Signin;