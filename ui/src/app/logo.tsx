"use client"
import { Box, Text } from '@zuzjs/ui';
import React from 'react';

const Logo : React.FC = (_props) => {
    return <Box as={`flex aic mb:20`}>
        <Text as={`s:50 bold c:$primary --gfont`}>z</Text>
        <Text as={`s:50 bold --gfont`}>Panel</Text>
    </Box>
}

export default Logo;