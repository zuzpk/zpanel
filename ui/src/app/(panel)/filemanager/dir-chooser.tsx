"use client"
import { pubsub } from '@/cache';
import { PubEvent } from '@/types';
import { Box, Button, DrawerController, Input, useDrawer } from '@zuzjs/ui';
import React, { useEffect, useRef } from 'react';
import FileBrowser from './file-browser';

const DirChooser : React.FC<{
    defaultPath: string,
    onChoose: (path: string) => void
}> = ({ defaultPath, onChoose }) => {

    const homeDir = useRef<HTMLInputElement>(null)
    const drawer = useRef<DrawerController>(null)

    const browser = useDrawer()
    const chooseDir = () => {
        drawer.current = browser.right(
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
        pubsub.on(PubEvent.OnTargetDirChoosen, () => drawer.current.close())
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