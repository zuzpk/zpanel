"use client"
import { APP_NAME, LocalDB, REDIRECT_AFTER_OAUTH } from '@/config';
import { AppStore } from '@/store';
import Style from '@/ui';
import { useStore } from '@zuzjs/store';
import { Box, Button, css, dynamicObject, Form, FORMVALIDATION, Group, Input, Password, Sheet, SheetHandler, Text, TRANSITION_CURVES, TRANSITIONS, useDB, useDelayed, useMounted, Variant } from '@zuzjs/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import { APP_VERSION } from '../config';
import Logo from './logo';
import Authenticate from "./oauth";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Signin : React.FC = (_props) => {

    const when = useDelayed()
    // const anim = useMemo(() => ({
    //     transition: TRANSITIONS.SlideInTop,
    //     curve: TRANSITION_CURVES.Spring,
    //     when: mounted,
    //     duration: 0.5
    // }), [mounted])
    const { loading, ID, dispatch } = useStore<typeof AppStore.User>(`user`)
    const router = useRouter();
    const { insert } = useDB(LocalDB.You)
    const toast = useRef<SheetHandler>(null)

    const onSuccess = useCallback((resp: dynamicObject) => {
        // insert(`you`, resp.u)
        dispatch({ ...resp.user, loading: false }).then(() => router.push(`${REDIRECT_AFTER_OAUTH}?_=${Date.now()}`))
    }, [])

    const onFailed = useCallback((err: dynamicObject) => {
        toast.current?.error(err.message)
    }, [])

    useEffect(() => {
        window.document.title = `Sign in - ${APP_NAME}`
        if ( !loading && ID != -1 ){
            router.push(`${REDIRECT_AFTER_OAUTH}?_=${Date.now()}`)
        }
    }, [loading, ID])

    return <Suspense>
        <Authenticate redirect={false} />
        <Box as={`w:100vw h:100vh flex aic jcc`}>
        <Form 
            name={`auth`}
            action={`/_/a/login`}
            onSuccess={onSuccess}
            onError={onFailed}
            errors={{
                usr: `Username is required`,
                psw: `Password is required`,
            }}>
            <Group 
                as={`flex aic jcc cols w:300 gap:12`}
                fx={{
                    transition: TRANSITIONS.SlideInBottom,
                    curve: TRANSITION_CURVES.Liquid,
                    when,
                    duration: 1,
                    delay: 0.05
                }}
                fxStep={0.1}>

            <Box><Logo /></Box>

            <Input variant={Variant.Medium} name={`usr`} placeholder={`Username`} required />
            <Password variant={Variant.Medium} name={`psw`} placeholder={`Password`} required />
            
            <Button variant={Variant.Medium} type={`submit`} as={`w:100%! mt:25`}>Sign in</Button>

            <Text as={`s:14 opacity:0.5 mt:50`}>Copyright © {new Date().getFullYear()} - v{APP_VERSION}</Text>

            </Group>

        </Form>
        <Sheet ref={toast} />
    </Box>
    </Suspense>
}

export default Signin;