import { useState, useRef, useCallback } from 'react';
import { 
  Bold, Italic, Underline, List, ListOrdered, 
  AlignLeft, AlignCenter, AlignRight, Link, 
  Image, Code, Quote, Heading1, Heading2, Heading3,
  Undo, Redo, Strikethrough
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder = 'Write your content...' }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    editorRef.current?.focus();
  }, [onChange]);

  const handleFormat = (format: string) => {
    execCommand(format);
  };

  const handleHeading = (level: number) => {
    execCommand('formatBlock', `h${level}`);
  };

  const handleList = (ordered: boolean) => {
    execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  };

  const handleAlign = (align: string) => {
    execCommand(`justify${align}`);
  };

  const handleLink = () => {
    if (linkUrl) {
      execCommand('createLink', linkUrl);
      setLinkUrl('');
      setShowLinkModal(false);
    }
  };

  const handleInsertCode = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const code = document.createElement('code');
      code.className = 'bg-[#1a1a1a] px-1 rounded text-white';
      code.textContent = range.toString();
      range.deleteContents();
      range.insertNode(code);
      onChange(editorRef.current?.innerHTML || '');
    }
  };

  const handleBlockquote = () => {
    execCommand('formatBlock', 'blockquote');
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    handleInput();
  };

  const ToolbarButton = ({ 
    onClick, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    children: React.ReactNode; 
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-2 text-zinc-400 hover:text-white hover:bg-[#0f0f11] rounded transition-colors"
    >
      {children}
    </button>
  );

  const Divider = () => (
    <div className="w-px h-6 bg-[#1a1a1a] mx-1" />
  );

  return (
    <div className="border border-[#111] rounded-sm overflow-hidden bg-black">
      {/* Toolbar */}
      <div className="bg-[#0d0d0f] border-b border-[#1a1a1a] p-2 flex flex-wrap items-center gap-1">
        {/* Undo/Redo */}
        <ToolbarButton onClick={() => execCommand('undo')} title="Undo">
          <Undo size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => execCommand('redo')} title="Redo">
          <Redo size={16} />
        </ToolbarButton>
        
        <Divider />
        
        {/* Headings */}
        <ToolbarButton onClick={() => handleHeading(1)} title="Heading 1">
          <Heading1 size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => handleHeading(2)} title="Heading 2">
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => handleHeading(3)} title="Heading 3">
          <Heading3 size={16} />
        </ToolbarButton>
        
        <Divider />
        
        {/* Text Formatting */}
        <ToolbarButton onClick={() => handleFormat('bold')} title="Bold (Ctrl+B)">
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => handleFormat('italic')} title="Italic (Ctrl+I)">
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => handleFormat('underline')} title="Underline (Ctrl+U)">
          <Underline size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => handleFormat('strikeThrough')} title="Strikethrough">
          <Strikethrough size={16} />
        </ToolbarButton>
        
        <Divider />
        
        {/* Lists */}
        <ToolbarButton onClick={() => handleList(false)} title="Bullet List">
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => handleList(true)} title="Numbered List">
          <ListOrdered size={16} />
        </ToolbarButton>
        
        <Divider />
        
        {/* Alignment */}
        <ToolbarButton onClick={() => handleAlign('Left')} title="Align Left">
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => handleAlign('Center')} title="Align Center">
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={() => handleAlign('Right')} title="Align Right">
          <AlignRight size={16} />
        </ToolbarButton>
        
        <Divider />
        
        {/* Special */}
        <ToolbarButton onClick={() => setShowLinkModal(true)} title="Insert Link">
          <Link size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={handleInsertCode} title="Insert Code">
          <Code size={16} />
        </ToolbarButton>
        <ToolbarButton onClick={handleBlockquote} title="Quote">
          <Quote size={16} />
        </ToolbarButton>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="bg-[#0d0d0f] border-b border-[#1a1a1a] p-3 flex items-center gap-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL..."
            className="flex-1 bg-[#030303] border border-[#1a1a1a] rounded px-3 py-1.5 text-white text-sm placeholder-zinc-500 focus:ring-2 focus:ring-white/20 focus:border-transparent"
          />
          <button
            type="button"
            onClick={handleLink}
            className="px-3 py-1.5 bg-white text-black font-medium rounded text-sm hover:bg-white/90"
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => setShowLinkModal(false)}
            className="px-3 py-1.5 bg-[#0d0d0f] border border-[#1a1a1a] text-white rounded text-sm hover:bg-[#0f0f11]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: value }}
        className="min-h-[200px] max-h-[400px] overflow-y-auto p-4 text-white focus:outline-none prose prose-invert prose-sm max-w-none
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3 [&_h1]:text-white
          [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:text-white
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:text-white
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
          [&_li]:text-zinc-300 [&_li]:my-1
          [&_a]:text-white [&_a]:underline
          [&_blockquote]:border-l-4 [&_blockquote]:border-white/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-400
          [&_code]:bg-[#1a1a1a] [&_code]:px-1 [&_code]:rounded [&_code]:text-white
          [&_strong]:font-bold [&_strong]:text-white
          [&_em]:italic
          [&_u]:underline
          [&_s]:line-through"
        data-placeholder={placeholder}
        style={{ 
          minHeight: '200px'
        }}
      />

      {/* Character count */}
      <div className="bg-[#050505] border-t border-[#111] px-4 py-2 text-xs text-zinc-500">
        {value.replace(/<[^>]*>/g, '').length} characters
      </div>
    </div>
  );
};

export default RichTextEditor;
