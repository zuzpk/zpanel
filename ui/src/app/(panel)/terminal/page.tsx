"use client"
import { Box, Text } from '@zuzjs/ui';
import React from 'react';
import ZuzTerminal from '.';
import { WSS_URL_TERMINAL } from '@/config';
import PageTitle from '../page-title';

const Page : React.FC = (_props) => {
    return <Box as={`w:calc[100vw - 60px] h:100dvh no-overflow flex cols p:$page-padding bg:000 gap:15`}>
        <PageTitle
            crumb={[
                {
                    label: `Terminal`,
                    icon: `code-1`
                }
            ]}
             />
        <ZuzTerminal />
        
    </Box>
}

export default Page;