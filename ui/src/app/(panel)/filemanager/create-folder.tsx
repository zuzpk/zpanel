"use client"
import { dynamic, withPost } from '@zuzjs/core';
import { Box, Button, Cover, Form, Input, Text, useToast, Variant } from '@zuzjs/ui';
import React, { useRef } from 'react';

const CreateFolder : React.FC<{
    onSuccess: (dir: string) => void,
    parent: string
}> = ({ onSuccess, parent }) => {

    const toast = useToast()
    const [ loading, setLoading ] = React.useState(false)
    const fn = useRef<HTMLInputElement>(null)

    const create = () => {
        if ( !fn.current || !fn.current.value.trim() ){
            toast.error(`Folder name is required...`)
            fn.current?.focus()
            return;
        }

        setLoading(true)

        withPost<{
            kind: string;
            message: string;
            target: string;
        }>(`/_/fm/new_folder`, {
            n: fn.current.value,
            d: parent
        })
        .then(resp => {
            setLoading(false)
            onSuccess(resp.target)
        })
        .catch(err => {
            setLoading(false)
            toast.error(err.message || `Folder not created...`)
        })

    }

    return <Box as={`flex cols gap:5 w:400 p:20 rel`}>

        <Cover when={loading} />
        <Box as={`flex aic gap:5 mb:20`}>
            <Text as={`s:14 bold opacity:0.5`}>Parent</Text>
            <Text as={`s:14 opacity:0.7 text-wrap`}>{parent}</Text>
        </Box>

        <Text as={`s:14 bold`}>Name</Text>
        <Input 
            ref={fn}
            autoFocus={true}
            placeholder={`Folder Name`} name={`n`} required />

        <Button
            onClick={create}
            as={`mt:30 w:160! bold`}>Save</Button>
    </Box>

    return <Form
        onSuccess={onSuccess}
        onError={err => {
            toast.error(err.message || `Folder not created...`)
        }}
        action={`/_/fm/new_folder`}
        errors={{
                n: `Folder name is required`
        }}
        as={`flex cols gap:5 w:400 p:20`}>
       
        <Box as={`flex aic gap:5 mb:20`}>
            <Text as={`s:14 bold opacity:0.5`}>Parent</Text>
            <Text as={`s:14 opacity:0.7 text-wrap`}>{parent}</Text>
        </Box>

        <Text as={`s:14 bold`}>Name</Text>
        <Input 
            autoFocus={true}
            placeholder={`Folder Name`} name={`n`} required />
        
        <Input type={`hidden`} value={parent} name={`d`} />

        <Button
            type={`submit`} 
            as={`mt:30 w:160! bold`}>Save</Button>

    </Form>

}

export default CreateFolder;