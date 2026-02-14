import { Box, Button, Group, Icon, Text } from '@zuzjs/ui';
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

    return <Group as={`w:500 p:20 r:$radius flex aic jcc cols`}>
        <Icon 
            name={type == `error` ? `lamp-on` : `emoji-happy`} 
            as={[
                `s:50 mb:25`,
                `${type == `error` ? `c:$red-800` : `c:$green-700`}`
            ]} />
        { Array.isArray(title) ? <>{title?.map((m, i) => <Text key={`done-title-${i}`} as={`s:24 bold`}>{m}</Text>)}</>
                : <Text key={`done-title-default`} as={`s:24 bold`}>{title || `Good Job`}</Text>}

        { Array.isArray(message) ? <>{message?.map((m, i) => <Text key={`done-msg-${i}`} as={`s:16 bold`}>{m}</Text>)}</>
                : <Text key={`done-msg-main`} as={`s:16 bold`}>{message || `That was easy. You did it :)`}</Text>}

        {action && <Box as={`mt:25`}>
            <Button onClick={() => {
                if ( action?.on ) action.on()
            }}>{action?.label ?? `Re-try`}</Button>
        </Box>}
    
    </Group>
}

export default Done;