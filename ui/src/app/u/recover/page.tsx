"use client"
import { APP_NAME } from '@/config';
import Style from '@/ui';
import { Box, Button, css, dynamicObject, Form, FORMVALIDATION, Input, Text, TRANSITION_CURVES, TRANSITIONS, useMounted, Variant } from '@zuzjs/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Recover : React.FC = (_props) => {

    const mounted = useMounted()
    const anim = useMemo(() => ({
        transition: TRANSITIONS.SlideInTop,
        curve: TRANSITION_CURVES.Spring,
        when: mounted,
        duration: 0.5
    }), [mounted])

    const router = useRouter();

    const onSuccess = (resp: dynamicObject) => {
        router.push(`/u/recover/verify/${resp.token}/${encodeURIComponent(resp.email)}`)
    }

    useEffect(() => {}, [])

    return <Box as={`minH:calc[100vh - 70px] flex aic jcc`}>
        <Form 
            name={`recover`}
            action={`/@/u/recover`}
            onSuccess={onSuccess}
            errors={{
                em: `Valid email is required`,
            }}
            as={`flex aic jcc cols w:400 gap:12`}>
            
            <Text fx={{ ...anim, delay: 0.1 }} as={`s:30 b:900 mb:30`}>Recover {APP_NAME} Account</Text>

            <Input variant={Variant.Medium} name={`em`} placeholder={`Email`} fx={{ ...anim, delay: 0.1 }} required with={FORMVALIDATION.Email} />
            
            <Button variant={Variant.Medium} type={`submit`} as={`mt:25 w:100%!`} fx={{ ...anim, delay: 0.35 }}>Continue</Button>

            <Text as={`mt:35`} fx={{ ...anim, delay: 0.45 }}>Already have an account? <Link className={css(`${Style.Link} bold`)} href={`/u/signin`}>Sign in here</Link></Text>
            <Text fx={{ ...anim, delay: 0.45 }}>New here? <Link className={css(`${Style.Link} bold`)} href={`/u/signup`}>Create account</Link></Text>

        </Form>
    </Box>
}

export default Recover