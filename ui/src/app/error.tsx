"use client"
import { ADMIN_EMAIL } from '@/config';
import { Box, Button, Group, Span, Text } from '@zuzjs/ui';
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

    const _msg = (m: string | ReactNode, delay = 0.2, i: number) => <Text key={`--error-title-${i}-${(React.isValidElement(m) ? `rnc` : m?.toString())!.replace(/\s+/g, `-`)}`} as={`s:16`}>{m}</Text>

    return <Group
        as={`rel zIndex:3 app-error w:100% p:20vh,20,20,20 r:$radius flex aic jcc cols`}>
        
        <Text as={`s:24 bold`}>{code || `psst!`}</Text>
        
        { Array.isArray(title) ? <>{title?.map((m, i) => <Text key={`--error-title-${i}-${m.toString().replace(/\s+/g, `-`)}`} as={`s:18 bold`}>{m}</Text>)}</>
                : <Text key={`--error-title-main`} as={`s:18 bold`}>{title || `it's not you, it's us`}</Text>}

        <Box as={`h:10`} />
        { message ? 
            Array.isArray(message) ? <>{message?.map((m, i) => _msg(m, 0.2 * (i + 1), i))}</>
                : _msg(message || `we're experiencing an internal server problem.`, 0.2, 0)
            : !code && <>
                {_msg(`we're experiencing an internal server problem.`, 0.2, 0)}
                {_msg(<Span>please try again in few or contact <b>{ADMIN_EMAIL}</b></Span>, .4, 0)}
            </>}

        {action && <Box as={`mt:25`}>
            <Button onClick={() => {
                if ( action?.on ) action.on()
            }}>{action?.label || `Re-try`}</Button>
        </Box>}
    
    </Group>
}

export default Error;