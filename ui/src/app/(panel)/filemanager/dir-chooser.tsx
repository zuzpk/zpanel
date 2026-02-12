"use client"
import { Box, Button, Drawer, DRAWER_SIDE, useDrawer, Input, Text, Variant } from '@zuzjs/ui';
import React, { useCallback, useEffect, useRef } from 'react';
import FileBrowser from './file-browser';
import { pubsub } from '@/cache';
import { PubEvent } from '@/types';

const DirChooser : React.FC<{
    defaultPath: string,
    onChoose: (path: string) => void
}> = ({ defaultPath, onChoose }) => {

    const homeDir = useRef<HTMLInputElement>(null)
    const drawerId = useRef(-1)

    const browser = useDrawer()
    const chooseDir = () => {
        drawerId.current = browser.right(
            <FileBrowser
                defaultDir={defaultPath}
                onChoose={d => {
                    onChoose(d)
                    if ( homeDir.current ){
                        homeDir.current.value = d
                    }
                }} />
        )
    }

    useEffect(() => {
        pubsub.on(PubEvent.OnTargetDirChoosen, () => browser.close(drawerId.current))
    }, [])

    return <Box as={`flex aic gap:15`}>
        <Input
            ref={homeDir}
            readOnly={true}
            defaultValue={defaultPath}
            placeholder={`/home/your-app`} name={`root`} required />
        <Button 
            onClick={chooseDir}
            icon={`folder`} 
            />
    </Box>
}

export default DirChooser;