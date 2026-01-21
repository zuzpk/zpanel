"use client"
import { Box, Button, Text, Variant } from "@zuzjs/ui"
import Editor, { useMonaco } from "@monaco-editor/react"
import { useEffect, useRef, useState } from "react";
import { FileItem } from "@/types";
import dynamic from "next/dynamic";
import { detectMonacoLanguage } from "./filetypes";

// const Editor = dynamic(() => import("@monaco-editor/react").then(mod => mod.default), {
//   ssr: false,
//   loading: () => <Box>Loading editor...</Box>,
// })

const CodeEditor : React.FC<{
    files: FileItem[]
    onSave?: ( newContent: string ) => void;
}> = ({ files: defaultFiles }) => {

    // const monaco = useMonaco();

    // useEffect(() => {
    //     // do conditional chaining
    //     // monaco?.languages.typescript.javascriptDefaults.setEagerModelSync(true);
    //     // or make sure that it exists by other ways
    //     if (monaco) {
    //         console.log("here is the monaco instance:", monaco);
    //     }
    // }, [monaco]);
    const [files, setFiles] = useState(defaultFiles)

    // { fileName, initialValue, onSave }
    const editorRef = useRef<any>(null)
    const monacoRef = useRef<any>(null)
    const modelsRef = useRef<Record<string, any>>({})
    const [activeFile, setActiveFile] = useState<FileItem | null>(files[0] ?? null)

    const handleEditorDidMount = (editor: any, monaco: any) => {
        editorRef.current = editor
        monacoRef.current = monaco

        // Create or reuse models
        files.forEach((f) => {
        if (!modelsRef.current[f.path]) {
            const model = monaco.editor.createModel(
                f.content ?? "",
                // f.path
                detectMonacoLanguage(f.label),           // ← important: set language
                monaco.Uri.parse(`inmemory://model${f.path}`)  // better than inmemory://
            )
            modelsRef.current[f.path] = model
        }
        })

        // Set initial model
        if (activeFile) {
            editor.setModel(modelsRef.current[activeFile.path])
        }
    }

    useEffect(() => {
        if (editorRef.current && activeFile && modelsRef.current[activeFile.path]) {
            editorRef.current.setModel(modelsRef.current[activeFile.path])
            editorRef.current.focus()
        }
    }, [activeFile])

    useEffect(() => {
        return () => {
        Object.values(modelsRef.current).forEach((model: any) => model?.dispose())
        }
    }, [])

    return <Box as={`flex cols w:100% h:100vh --monaco-editor-container bg:$btn-tab-hover`}>
        <Box as={`h:40 s:18 bold flex aic gap:15 ph:10 borderBottom:1,$btn-tab,solid`}>
            <Box as={`flex aic flex:1 gap:2 overflowX:auto overflowY:hidden`}>
                {files.map( (f) => <Button 
                    as={`p:8! h:40! --cf-tab ${activeFile?.path == f.path ? `--cf-on` : `--cf-off` }`}
                    key={f.path} 
                    onClick={() => setActiveFile(f)}>{f.label}</Button>)}
                {/* <Button 
                    icon={`add`}
                    as={`p:8,12! h:40! --cf-tab --cf-off`}
                    onClick={() => {
                        setFiles([...files, {
                            token: `-`,
                            path: activeFile?.path!,
                            label: `Untitled`,
                            isDir: false,
                            size: 1024 *2,   
                            modified: Date.now(),
                            content: ``
                        }])
                        setTimeout(() => setActiveFile(files[files.length-1]), 1000)
                    }} /> */}
            </Box>
            <Box as={`flex aic gap:4`}>
                <Button 
                    as={`p:3,8!`}
                    variant={Variant.Small}
                    icon={`check`}>Save</Button>
            </Box>
        </Box>
        {activeFile && <Box as={`h:20 p:3,10 bg:$btn-tab`}>
            <Text as={`s:11 opacity:0.5`}>{activeFile.path}</Text>
        </Box>}
        <Box as={`flex:1 h:calc[100vh - 60px]`}>
            <Editor
                height="100%"
                theme="vs-dark"
                onMount={handleEditorDidMount}
                onChange={(value: any) => {
                    console.log(`edited`, value)
                }}
                options={{
                    minimap: { enabled: true },
                    fontSize: 15,
                    automaticLayout: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    scrollBeyondLastLine: false,
                    fixedOverflowWidgets: true,
                    readOnly: false,                    // ← explicitly not read-only
                    domReadOnly: false,
                    glyphMargin: true,
                    folding: true,
                    lineNumbers: "on",
                    renderLineHighlight: "all",
                    wordWrap: "on",
                }}
            />
        </Box>
    </Box>

}

export default CodeEditor;