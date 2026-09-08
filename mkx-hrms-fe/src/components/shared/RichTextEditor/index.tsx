import React, { useEffect, useMemo, useCallback } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  RichTextEditorProvider,
  RichTextField,
  MenuControlsContainer,
  MenuSelectHeading,
  MenuDivider,
  MenuButtonBold,
  MenuButtonItalic,
  MenuButtonStrikethrough,
  MenuButtonCode,
  MenuButtonBulletedList,
  MenuButtonOrderedList,
  MenuButtonBlockquote,
  MenuButtonUndo,
  MenuButtonRedo,
  MenuButtonEditLink,
  MenuButtonAddImage,
} from "mui-tiptap";
import { Box, FormHelperText, Typography } from "@mui/material";
import { getIn, type FormikProps } from "formik";
import { cn } from "utils";

/**
 * Properties for the standardized RichTextEditor component
 *
 * @template TFormValues - The form values model if used within Formik
 */
export interface RichTextEditorProps<TFormValues = Record<string, unknown>> {
  /** Field name matching Formik schema key */
  name?: string;
  /** Label displayed above the editor */
  label?: string;
  /** Formik bag instance for automated value binding and error display */
  formik?: FormikProps<TFormValues>;
  /** Explicit HTML string value when used outside Formik */
  value?: string;
  /** Callback triggered when editor HTML content updates */
  onChange?: (html: string) => void;
  /** Placeholder text when content is empty */
  placeholder?: string;
  /** Minimum height of the editable text area */
  minHeight?: number | string;
  /** Maximum height of the editable text area before scrolling */
  maxHeight?: number | string;
  /** Additional container class names */
  className?: string;
  /** Whether editing is disabled */
  disabled?: boolean;
}

/**
 * Modern WYSIWYG rich text editor built with mui-tiptap and Tiptap 2
 *
 * @template TFormValues - Structure of Formik form values
 * @param props - Configuration properties for RichTextEditor
 * @returns Rendered rich text editor
 */
export function RichTextEditor<TFormValues = Record<string, unknown>>({
  name,
  label,
  formik,
  value,
  onChange,
  minHeight = 220,
  maxHeight = 450,
  className,
  disabled = false,
}: RichTextEditorProps<TFormValues>): React.ReactElement {
  /**
   * Determine initial and active content from Formik or value prop
   */
  const currentContent = useMemo(() => {
    if (formik && name) {
      const formikVal = getIn(formik.values, name);
      return typeof formikVal === "string" ? formikVal : "";
    }
    return typeof value === "string" ? value : "";
  }, [formik, name, value]);

  /**
   * Propagate editor updates to Formik or explicit onChange handler
   */
  const handleEditorUpdate = useCallback(
    (html: string) => {
      if (formik && name) {
        formik.setFieldValue(name, html);
      }
      if (onChange) {
        onChange(html);
      }
    },
    [formik, name, onChange],
  );

  /**
   * Initialize Tiptap editor instance with StarterKit, Link, and Image
   */
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: currentContent,
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      handleEditorUpdate(html);
    },
  });

  /**
   * Synchronize external value changes with the internal Tiptap editor state
   */
  useEffect(() => {
    if (editor && currentContent !== editor.getHTML()) {
      editor.commands.setContent(currentContent);
    }
  }, [editor, currentContent]);

  /**
   * Extract error state from Formik
   */
  const error = useMemo(() => {
    if (!formik || !name) return false;
    const isTouched = Boolean(getIn(formik.touched, name));
    const err = getIn(formik.errors, name);
    return isTouched && Boolean(err);
  }, [formik, name]);

  /**
   * Extract error message string from Formik
   */
  const errorMessage = useMemo(() => {
    if (!formik || !name) return undefined;
    const isTouched = Boolean(getIn(formik.touched, name));
    const err = getIn(formik.errors, name);
    return isTouched && typeof err === "string" ? err : undefined;
  }, [formik, name]);

  return (
    <Box className={cn("flex flex-col gap-1.5 w-full", className)}>
      {label && (
        <Typography variant="caption" className="!font-medium !text-muted-foreground">
          {label}
        </Typography>
      )}

      <Box
        className={cn(
          "border rounded-[5px] overflow-hidden transition-all bg-card/60",
          error
            ? "border-destructive ring-1 ring-destructive/30"
            : "border-border hover:border-border/80 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary",
          disabled && "opacity-60 pointer-events-none",
        )}
      >
        <RichTextEditorProvider editor={editor}>
          <RichTextField
            controls={
              <MenuControlsContainer className="!border-b !border-border !bg-secondary/40 !p-1 !gap-0.5 !flex-wrap">
                <MenuSelectHeading />
                <MenuDivider />
                <MenuButtonBold />
                <MenuButtonItalic />
                <MenuButtonStrikethrough />
                <MenuButtonCode />
                <MenuDivider />
                <MenuButtonBulletedList />
                <MenuButtonOrderedList />
                <MenuButtonBlockquote />
                <MenuDivider />
                <MenuButtonEditLink />
                <MenuButtonAddImage
                  onClick={() => {
                    const url = window.prompt("Enter image URL:");
                    if (url && editor) {
                      editor.chain().focus().setImage({ src: url }).run();
                    }
                  }}
                />
                <MenuDivider />
                <MenuButtonUndo />
                <MenuButtonRedo />
              </MenuControlsContainer>
            }
            className={cn(
              "[&_.ProseMirror]:p-3 [&_.ProseMirror]:outline-none [&_.ProseMirror]:text-foreground [&_.ProseMirror]:text-sm",
              "[&_.ProseMirror_p]:my-1.5 [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:my-2",
              "[&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:my-2",
              "[&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:my-1.5",
              "[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5",
              "[&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-primary/60 [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:italic",
              "[&_.ProseMirror_code]:bg-secondary [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded text-xs",
            )}
            sx={{
              "& .ProseMirror": {
                minHeight,
                maxHeight,
                overflowY: "auto",
              },
            }}
          />
        </RichTextEditorProvider>
      </Box>

      {errorMessage && (
        <FormHelperText error className="!mx-0 !text-xs">
          {errorMessage}
        </FormHelperText>
      )}
    </Box>
  );
}

export default RichTextEditor;
