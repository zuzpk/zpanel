"use client"
import Done from '@/app/done'
import Style from '@/ui'
import { Box, Button, Cover, Form, PinInput, Sheet, SheetHandler, Text, TRANSITION_CURVES, TRANSITIONS, useMounted, Variant } from '@zuzjs/ui'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { withPost,dynamic } from "@zuzjs/core"

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Verify : React.FC = (_props) => {

    const [ token, em ] = useParams().token ?? [ `token`, `em` ]
    const [ resend, setSend ] = useState(false)
    const [ verifying, setVerifying ] = useState(em ? false : true)
    const [ done, setDone ] = useState<number | null>(0)
    const mounted = useMounted()
    const anim = useMemo(() => ({
        transition: TRANSITIONS.SlideInTop,
        curve: TRANSITION_CURVES.Spring,
        when: mounted,
        duration: 0.5
    }), [mounted])
    const toast = useRef<SheetHandler | null>(null)

    const onSuccess = (resp : dynamic) => {
        setVerifying(false)
        setDone(resp.name)
    }

    const autoVerify = () => {
        withPost<{
            name: string
        }>(
            `/@/u/verify`,
            { token }
        )
        .then(onSuccess)
        .catch(err => {
            setVerifying(false)
            setDone(err.code == 101 ? 101 : null)
            toast.current!.error(err.message || `Failed to verify account`)
        })
    }

    useEffect(() => {
        
        document.title = `Verify Email`

        if ( em ){
            setTimeout(() => setSend(true), 4000)
        }
        else autoVerify()

    }, [])

    return <><Box as={`minH:calc[100vh - 70px] flex aic jcc rel`}>
        <Cover when={verifying} message={`verfying...`} />
        { done ? done == 101 ? <Done 
            type={`error`}
            title={`Already verified`}
            message={`Your account is already verified. Continue to Login`} />
            : <Done 
            type={`success`}
            title={`Good Job, ${done}`} 
            message={`Your account is verified now. Continue to Login`} />
        : <Form 
            withData={{
                token
            }}
            name={`verify`}
            onSuccess={onSuccess}
            action={`/@/u/verify`}
            errors={{
                otp: `OTP Code is required`,
            }}
            as={`flex aic jcc cols w:350 gap:12`}>
            
            <Text fx={{ ...anim, delay: 0.1 }} as={`s:18 mb:10 tac`}>We have sent you a verification code{em ? <> to <b>{decodeURIComponent(em)}</b></> : null}</Text>

            <PinInput name={`otp`} as={`s:40! b:900`} fx={{ ...anim, delay: 0.25 }} length={6} variant={Variant.Medium} required />
            
            <Button variant={Variant.Medium} type={`submit`} as={`mt:25 w:100%!`} fx={{ ...anim, delay: 0.35 }}>Verify</Button>

            { resend && <Box as={`mt:25 s:16`} fx={{ ...anim, delay: 0.4 }}>Code not received? <Link href={`/u/signup?resend=1`} className={Style.Link}>Re-send code</Link></Box> }

        </Form>}
    </Box>
    <Sheet ref={toast} />
    </>
}

export default Verify;