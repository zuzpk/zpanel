"use client"
import { pubsub } from '@/cache';
import { AppStore, Store } from '@/store';
import { PubEvent } from '@/types';
import { useStore } from '@zuzjs/store';
import { Box, Button, Crumb, Input, Text, useToast, Variant } from '@zuzjs/ui';
import React, { useCallback, useRef, useState } from 'react';
import FileManager from '.';
import { _, withPost } from '@zuzjs/core';

const NewFile : React.FC<{
    event: PubEvent
}> = ({ event }) => {
    
    const { 
        loading, 
        currentDir,
        selectedItem
    } = useStore<typeof AppStore.FileManager>(Store.FileManager);
    const [ targetDir, setTargetDir ] = useState(`/etc/nginx/conf.d`)
    const fileName = useRef<HTMLInputElement>(null)
    const toast = useToast()

    const saveFile = useCallback(async () => {
        const fn = fileName.current?.value ?? ""
        if ( _(fileName).isEmpty() ){
            fileName.current?.focus()
            toast.error(`Name is required...`)
        }
        else{
            toast.clearAll()
            withPost<{
                message: string
            }>(
                `/_/fm/new_file`,
                { d: targetDir, n: fn }
            )
            .then((resp) => {
                fileName.current!.value = ``
                toast.error(resp.message || `File created`)
                pubsub.emit(event)
            })
            .catch((err) => {
                toast.error(err.message || `File was not created`)
            })
        }
    }, [])

    return <Box as={`w:90vw h:100vh flex cols`}>
        <Box as={`flex aic rel p:$page-padding borderBottom:1,$border,solid`}>
            <Box as={`flex flex:1 cols`}>
                <Text as={`s:18 bold mb:6 pl:6`}>Files</Text>
                <Text as={`s:14 opacity:0.5 p:0,6`}>Path: {currentDir}</Text>
                { currentDir !== `/` && <Crumb
                    items={[
                        {
                            label: `Root`,
                            action: () => pubsub.emit(PubEvent.OpenDirectory, `/`)
                        },
                        ...currentDir.split(`/`)
                        .filter(n => Boolean(n))
                        .map((c, i) => ({
                            label: c,
                            action: () => {
                                pubsub.emit(PubEvent.OpenDirectory,  [ ...currentDir.split(`/`).slice(0, i+1), c ].join(`/`))
                            }
                            }))]} /> }
                <Box as={`h:15`} />
            </Box>
            <Box as={`flex aic gap:5`}>
                <Input 
                    ref={fileName}
                    placeholder={`Name`} as={`s:16 bg:$dim-light! w:500!`} variant={Variant.Small} />
                <Button 
                    onClick={saveFile}
                    icon={`document-upload`} 
                    variant={Variant.Small}>Save</Button>
            </Box>
        </Box>
        <FileManager 
            onDirChange={d => d !== targetDir && setTargetDir(d)}
            defaultDir={targetDir} />
    </Box>
}

export default NewFile;