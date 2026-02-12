"use client"
import { ADMIN_EMAIL } from '@/config';
import { useDelayed } from '@zuzjs/hooks';
import { Box, Button, Span, Text, TRANSITION_CURVES, TRANSITIONS, Variant } from '@zuzjs/ui';
import React, { ReactNode } from 'react';

type ErrorProps = {
    code?: string | number | null,
    title?: string | string[],
    message?: string | string[],
    action?: {
        label: string,
        on: () => void
    }
}

const Error : React.FC<ErrorProps> = ({ code, title, message, action }) => {

    const mounted = useDelayed()
    const _animation = {
        transition: TRANSITIONS.SlideInBottom,
        curve: TRANSITION_CURVES.Bounce,
        duration: .5,
        when: mounted
    }
    const _code = (m: string | number, delay = 0.1) => <Text as={`s:24 bold`} fx={{ ..._animation, delay }}>{m}</Text>
    const _title = (m: string | number, delay = 0.1, i: number) => <Text key={`--error-title-${i}-${m.toString().replace(/\s+/g, `-`)}`} as={`s:18 bold`} fx={{ ..._animation, delay }}>{m}</Text>
    const _msg = (m: string | ReactNode, delay = 0.2, i: number) => <Text key={`--error-title-${i}-${(React.isValidElement(m) ? `rnc` : m?.toString())!.replace(/\s+/g, `-`)}`} as={`s:16`} fx={{ ..._animation, delay }}>{m}</Text>

    return <Box as={`rel zIndex:3 app-error w:100% p:20vh,20,20,20 r:$radius flex aic jcc cols`}>
        {_code(code || `psst!`)}

        { Array.isArray(title) ? <>{title?.map((m, i) => _title(m, 0.1 * (i + 1), i))}</>
                : _title(title || `it's not you, it's us`, 0.1, 0)}

        <Box as={`h:10`} />
        { message ? 
            Array.isArray(message) ? <>{message?.map((m, i) => _msg(m, 0.2 * (i + 1), i))}</>
                : _msg(message || `we're experiencing an internal server problem.`, 0.2, 0)
            : !code && <>
                {_msg(`we're experiencing an internal server problem.`, 0.2, 0)}
                {_msg(<Span>please try again in few or contact <b>{ADMIN_EMAIL}</b></Span>, .4, 0)}
            </>}

        {action && <Box as={`mt:25`} fx={{ ..._animation, delay: .5 }}>
            <Button onClick={() => {
                if ( action?.on ) action.on()
            }} variant={Variant.Small}>{action?.label || `Re-try`}</Button>
        </Box>}
    
    </Box>
}

export default Error;