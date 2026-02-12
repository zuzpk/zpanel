"use client"
import { Box, Spinner, Text, TRANSITION_CURVES, TRANSITIONS } from '@zuzjs/ui';
import React from 'react';

const Dot : React.FC<{
    size?: number,
    type?: "success" | "error" | "idle" | "dead",
    loading?: boolean
}> = ({ 
    size = 6, 
    type = `idle`,
    loading = false
}) => {
    
    return <Box style={{
        width: `${size+4}px`,
        height: `${size+4}px`,
    }} as={`rel flex aic jcc`}>
        <Box 
            fx={{
                transition: TRANSITIONS.FadeIn,
                curve: TRANSITION_CURVES.Liquid,
                duration: 0.5,
                when: loading
            }}
            as={`abs abc`}><Spinner /></Box>
        <Box style={{
            width: `${size}px`,
            height: `${size}px`,
        }} as={[
            `corner:round! r:50%`,
            `${type == `idle` ? `bg:$orange-500` : ``}`,
            `${type == `success` ? `bg:$green-500` : ``}`,
            `${type == `error` ? `bg:$red-500` : ``}`,
            `${type == `dead` ? `bg:$text opacity:0.6` : ``}`,
        ]} />
    </Box>
}

export default Dot;