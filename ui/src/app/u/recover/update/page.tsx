"use client"
import Done from '@/app/done';
import { useStore } from '@zuzjs/store';
import { Box, Button, dynamicObject, Form, FORMVALIDATION, Password, Text, TRANSITION_CURVES, TRANSITIONS, useMounted, Variant } from '@zuzjs/ui';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Update : React.FC = (_props) => {

    const mounted = useMounted()
    const anim = useMemo(() => ({
        transition: TRANSITIONS.SlideInTop,
        curve: TRANSITION_CURVES.Spring,
        when: mounted,
        duration: 0.5
    }), [mounted])
    const { token } = useStore<dynamicObject>(`app`)
    const router = useRouter();
    const [ done, setDone ] = useState(null)

    const onSuccess = (resp: dynamicObject) => {
        setDone(resp.name)
    }

    useEffect(() => {
        if ( !token ){
            router.push(`/u/recover?resend=2`)
        }
    }, [])

    return <Box as={`minH:calc[100vh - 150px] flex aic jcc`}>
        { done ? <Done
            type={`success`}
            title={`Good Job, ${done}`} 
            message={`Your password is updated. Go Sign in`} /> 
        : <Form 
            name={`recoverupdate`}
            action={`/@/u/recover-update`}
            onSuccess={onSuccess}
            errors={{
                passw: `New Password is required`,
                repassw: `Passwords do not match`
            }}
            withData={{ token }}
            as={`flex aic jcc cols w:400 gap:12`}>
            
            <Text fx={{ ...anim, delay: 0.1 }} as={`s:30 b:900 mb:30`}>New Password</Text>

            <Password variant={Variant.Medium} name={`passw`} placeholder={`New Password`} fx={{ ...anim, delay: 0.2 }} required />
            <Password variant={Variant.Medium} name={`repassw`} placeholder={`Repeat Password`} fx={{ ...anim, delay: 0.2 }} required with={`match@passw` as FORMVALIDATION.Pattern} />

            <Button variant={Variant.Medium} type={`submit`} as={`mt:25`} fx={{ ...anim, delay: 0.35 }}>Continue</Button>

        </Form>}
    </Box>
}

export default Update