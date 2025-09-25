import React, { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Undo, 
  Redo,
  Smile,
  AtSign,
  Palette,
  Highlighter
} from 'lucide-react';
import { Button } from './button';
import { Separator } from './separator';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { cn } from '@/lib/utils';
import Tippy from '@tippyjs/react';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
}

const mockUsers = [
  { id: '1', label: 'João Silva', nickname: 'joao-silva' },
  { id: '2', label: 'Maria Santos', nickname: 'maria-santos' },
  { id: '3', label: 'Pedro Costa', nickname: 'pedro-costa' },
  { id: '4', label: 'Ana Oliveira', nickname: 'ana-oliveira' },
  { id: '5', label: 'Carlos Ferreira', nickname: 'carlos-ferreira' },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content = '',
  onChange,
  placeholder = 'Digite aqui...',
  maxLength = 160,
  className,
  disabled = false,
}) => {
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Underline,
      Strike,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Placeholder.configure({
        placeholder: ({ editor }) => {
          return editor.isEmpty ? placeholder : '';
        },
        
        includeChildren: false,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-blue-100 text-blue-800 px-1 rounded font-medium',
        },
        suggestion: {
          items: ({ query }: { query: string }) => {
            return mockUsers
              .filter(user => 
                user.label.toLowerCase().includes(query.toLowerCase()) ||
                user.nickname.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 5);
          },
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props: any) => {
                component = new MentionList(props);
                popup = document.createElement('div');
                popup.className = 'mention-suggestions';
                document.body.appendChild(popup);
                component.render(popup);
              },
              onUpdate(props: any) {
                component.updateProps(props);
              },
              onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                  popup.remove();
                  return true;
                }
                return component.onKeyDown(props);
              },
              onExit() {
                popup.remove();
              },
            };
          },
        },
      }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      setCharacterCount(text.length);
      
      if (text.length <= maxLength) {
        onChange?.(html);
      }
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm max-w-none focus:outline-none min-h-[100px] p-3',
          'prose-p:my-1 prose-p:leading-relaxed',
          className
        ),
        'data-placeholder': placeholder,
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      setCharacterCount(editor.getText().length);
    }
  }, [content, editor]);

  const addEmoji = useCallback((emoji: any) => {
    if (editor) {
      editor.chain().focus().insertContent(emoji.native).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  const emojiButtonRef = React.useRef<HTMLButtonElement>(null);
  const isOverLimit = characterCount > maxLength;

  return (
    <div className={cn('border border-gray-200 rounded-lg overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex items-center gap-1 flex-wrap bg-gray-50">
        {/* Undo/Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || disabled}
          className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || disabled}
          className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Redo className="h-4 w-4" />
        </button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          className={cn(
            'h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed',
            editor.isActive('bold') && 'bg-gray-200'
          )}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          className={cn(
            'h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed',
            editor.isActive('italic') && 'bg-gray-200'
          )}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={disabled}
          className={cn(
            'h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed',
            editor.isActive('underline') && 'bg-gray-200'
          )}
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
          className={cn(
            'h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed',
            editor.isActive('strike') && 'bg-gray-200'
          )}
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Color Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Palette className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2">
            <div className="grid grid-cols-6 gap-1">
              {[
                '#000000', '#374151', '#DC2626', '#EA580C', 
                '#D97706', '#65A30D', '#059669', '#0891B2',
                '#3B82F6', '#6366F1', '#8B5CF6', '#A21CAF'
              ].map((color) => (
                <button
                  type="button"
                  key={color}
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => editor.chain().focus().setColor(color).run()}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          disabled={disabled}
          className={cn(
            'h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed',
            editor.isActive('highlight') && 'bg-gray-200'
          )}
        >
          <Highlighter className="h-4 w-4" />
        </button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Mention */}
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().insertContent('@').run();
          }}
          disabled={disabled}
          className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AtSign className="h-4 w-4" />
        </button>

        {/* Emoji Picker */}
        <div>
          <button
            ref={emojiButtonRef}
            type="button"
            disabled={disabled}
            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
            className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Smile className="h-4 w-4" />
          </button>
          
          {isEmojiPickerOpen && (
            <Tippy
              appendTo={document.body}
              content={
                <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                  <Picker
                    data={data}
                    onEmojiSelect={addEmoji}
                    theme="light"
                    locale="pt"
                    previewPosition="none"
                    skinTonePosition="none"
                  />
                </div>
              }
              interactive={true}
              visible={isEmojiPickerOpen}
              onClickOutside={() => setIsEmojiPickerOpen(false)}
              reference={emojiButtonRef}
              placement="bottom-start"
              trigger="manual"
            />
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent 
          editor={editor} 
          className={cn(
            'tiptap min-h-[100px]',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />
        
        {/* Bubble Menu for selection - agora posicionado abaixo */}
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ 
            duration: 100,
            placement: 'bottom',
            offset: [0, 10] // Adiciona um pequeno espaço entre o texto e o menu
          }}
          className="bg-white border border-gray-200 rounded-lg shadow-lg p-1 flex items-center gap-1"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-gray-200',
              editor.isActive('bold') && 'bg-gray-200'
            )}
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-gray-200',
              editor.isActive('italic') && 'bg-gray-200'
            )}
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              'h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-gray-200',
              editor.isActive('underline') && 'bg-gray-200'
            )}
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>
        </BubbleMenu>

        {/* Character Counter */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
          <span className={cn(isOverLimit && 'text-red-500')}>
            {characterCount}/{maxLength}
          </span>
        </div>
      </div>
    </div>
  );
};

// Mention List Component (mantido igual)
class MentionList {
  items: any[];
  command: any;
  selectedIndex: number;
  element: HTMLElement | null = null;

  constructor({ items, command }: { items: any[]; command: any }) {
    this.items = items;
    this.command = command;
    this.selectedIndex = 0;
  }

  updateProps({ items, command }: { items: any[]; command: any }) {
    this.items = items;
    this.command = command;
    this.selectedIndex = 0;
    this.render();
  }

  onKeyDown({ event }: { event: KeyboardEvent }) {
    if (event.key === 'ArrowUp') {
      this.upHandler();
      return true;
    }

    if (event.key === 'ArrowDown') {
      this.downHandler();
      return true;
    }

    if (event.key === 'Enter') {
      this.enterHandler();
      return true;
    }

    return false;
  }

  upHandler() {
    this.selectedIndex = ((this.selectedIndex + this.items.length) - 1) % this.items.length;
    this.render();
  }

  downHandler() {
    this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
    this.render();
  }

  enterHandler() {
    this.selectItem(this.selectedIndex);
  }

  selectItem(index: number) {
    const item = this.items[index];
    if (item) {
      this.command({ id: item.id, label: item.label });
    }
  }

  render(container?: HTMLElement) {
    if (container) {
      this.element = container;
    }

    if (!this.element) return;

    this.element.innerHTML = '';
    this.element.className = 'mention-suggestions bg-white border border-gray-200 rounded-lg shadow-lg p-1 max-h-40 overflow-y-auto z-50';

    if (this.items.length === 0) {
      const noResults = document.createElement('div');
      noResults.className = 'p-2 text-gray-500 text-sm';
      noResults.textContent = 'Nenhum usuário encontrado';
      this.element.appendChild(noResults);
      return;
    }

    this.items.forEach((item, index) => {
      const button = document.createElement('button');
      button.className = `w-full text-left p-2 rounded hover:bg-gray-100 text-sm ${
        index === this.selectedIndex ? 'bg-gray-100' : ''
      }`;
    
      button.innerHTML = `
        <div class="font-medium">${item.label}</div>
        <div class="text-gray-500 text-xs">@${item.nickname}</div>
      `;
    
      button.addEventListener('click', () => this.selectItem(index));
      this.element.appendChild(button);
    });
  }
}