import { Box, Button, Icon, Text, TRANSITION_CURVES, TRANSITIONS, useDelayed, Variant } from '@zuzjs/ui';
import React from 'react';

type DoneProps = {
    type: `error` | `success`,
    title?: string | string[],
    message?: string | string[],
    action?: {
        label: string,
        on: () => void
    }
}

const Done : React.FC<DoneProps> = ({ type, title, message, action }) => {

    const mounted = useDelayed()
    const _animation = {
        transition: TRANSITIONS.SlideInBottom,
        curve: TRANSITION_CURVES.Bounce,
        duration: .5,
        when: mounted
    }
    const _title = (m: string, delay = 0.1) => <Text as={`s:24 bold`} fx={{ ..._animation, delay }}>{m}</Text>
    const _msg = (m: string, delay = 0.2) => <Text as={`s:16 bold`} fx={{ ..._animation, delay }}>{m}</Text>

    return <Box as={`w:500 p:20 r:$radius flex aic jcc cols`}>
        <Icon 
            name={type == `error` ? `lamp-on` : `emoji-happy`} 
            as={[
                `s:50 mb:25`,
                `${type == `error` ? `c:$red-800` : `c:$green-700`}`
            ]} 
            fx={{
                transition: TRANSITIONS.SlideInTop,
                curve: TRANSITION_CURVES.Bounce,
                duration: .5,
                when: mounted
            }} />
        { Array.isArray(title) ? <>{title?.map((m, i) => _title(m, 0.1 * (i + 1)))}</>
                : _title(title || `Good Job`)}

        { Array.isArray(message) ? <>{message?.map((m, i) => _msg(m, 0.2 * (i + 1)))}</>
                : _msg(message || `That was easy. You did it :)`)}

        {action && <Box as={`mt:25`} fx={{ ..._animation, delay: .5 }}>
            <Button onClick={() => {
                if ( action?.on ) action.on()
            }} variant={Variant.Small}>{action?.label ?? `Re-try`}</Button>
        </Box>}
    
    </Box>
}

export default Done;