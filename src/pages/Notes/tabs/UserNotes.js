import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Paper,
  IconButton,
  Tooltip,
  Popover,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Alert,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FormatColorTextIcon from '@mui/icons-material/FormatColorText';
import FormatSizeIcon from '@mui/icons-material/FormatSize';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatStrikethroughIcon from '@mui/icons-material/FormatStrikethrough';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import ClearIcon from '@mui/icons-material/Clear';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import { SketchPicker } from 'react-color';
import { useAuth } from '../../../contexts/AuthContext';
import { getDatabase, ref, set, get, remove } from 'firebase/database';

const LinedPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  minHeight: '60vh',
  background: theme.palette.background.paper,
  position: 'relative',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
  '& .placeholder': {
      position: 'absolute',
      top: '30px',
      left: '20px',
      color: '#666',
      opacity: 0.6,
      pointerEvents: 'none',
      userSelect: 'none',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
  '& .content': {
    lineHeight: '1.8',
    padding: theme.spacing(2),
    margin: '0',
    outline: 'none',
    width: '100%',
    minHeight: '60vh',
    background: 'transparent',
    border: 'none',
    color: theme.palette.text.primary,
    fontSize: '16px',
    fontFamily: 'inherit',
    resize: 'none',
    '&:focus': {
      outline: 'none',
    },
    '& p': {
      marginBottom: '16px',
      lineHeight: '1.8',
    },
    '& *': {
      margin: '0 0 0.5em 0',
      padding: '0'
    }
  }
}));

const ToolbarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  background: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  marginBottom: theme.spacing(2),
}));

const FloatingFormatBar = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  zIndex: 1000,
  display: 'flex',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1),
  background: 'rgba(124, 58, 237, 0.1)',
  backdropFilter: 'blur(10px)',
  borderRadius: theme.shape.borderRadius * 2,
}));

const UserNotes = () => {
  const [noteContent, setNoteContent] = useState('');
  const [showFormatting, setShowFormatting] = useState(false);
  const [formatPosition, setFormatPosition] = useState({ top: 0, left: 0 });
  const [colorPickerAnchor, setColorPickerAnchor] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectionRange, setSelectionRange] = useState(null);
  const [fontSizeAnchor, setFontSizeAnchor] = useState(null);
  const [alignmentAnchor, setAlignmentAnchor] = useState(null);
  const [insertLinkDialogOpen, setInsertLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [noteHistory, setNoteHistory] = useState([]);
  const [historyPosition, setHistoryPosition] = useState(-1);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]);
  const [noteName, setNoteName] = useState('');
  const contentRef = useRef(null);
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();

  // Initialize history with empty note
  useEffect(() => {
    if (noteHistory.length === 0) {
      setNoteHistory(['']);
      setHistoryPosition(0);
    }
  }, []);

  useEffect(() => {
    const handleKeyboard = (e) => {
      // Save: Ctrl + S
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Open: Ctrl + O
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        setFileDialogOpen(true);
      }
      // Print: Ctrl + P
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        printNote();
      }
      // New line: Shift + Enter
      if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        document.execCommand('insertLineBreak', false, null);
      }
    };

    // Disable context menu on the editor
    const handleContextMenu = (e) => {
      if (e.target.className === 'content') {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('keydown', handleKeyboard);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Handle selection changes
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setFormatPosition({
        top: rect.top - 40,
        left: rect.left + (rect.width / 2) - 100
      });
      setShowFormatting(true);

      // Store selection info for formatting
      const startNode = selection.anchorNode;
      const endNode = selection.focusNode;
      if (startNode && endNode) {
        setSelectionRange({
          selection: selection,
          range: range
        });
      }
    } else {
      setShowFormatting(false);
    }
  };

  // Fix for reverse typing issue - save the current cursor position after content changes
  useEffect(() => {
    const handleInput = () => {
      // Add current state to history
      if (contentRef.current) {
        const currentContent = contentRef.current.innerHTML;
        
        // Only add to history if content changed
        if (noteHistory[historyPosition] !== currentContent) {
          // Remove future history if we're not at the end
          const newHistory = noteHistory.slice(0, historyPosition + 1);
          newHistory.push(currentContent);
          
          // Limit history size to prevent memory issues
          if (newHistory.length > 50) {
            newHistory.shift();
          }
          
          setNoteHistory(newHistory);
          setHistoryPosition(newHistory.length - 1);
        }
      }
    };

    const element = contentRef.current;
    if (element) {
      element.addEventListener('input', handleInput);
      return () => element.removeEventListener('input', handleInput);
    }
  }, [noteHistory, historyPosition]);

  // Execute formatting command on selected text
  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    contentRef.current.focus();
    
    // Update note content state
    if (contentRef.current) {
      setNoteContent(contentRef.current.innerHTML);
    }
  };

  // Format text with custom styles
  const insertFormatting = (format, value = '') => {
    contentRef.current.focus();
    
    if (!selectionRange) return;
    
    switch(format) {
      case 'color':
        execCommand('foreColor', value);
        break;
      case 'size':
        execCommand('fontSize', value);
        break;
      case 'alignment':
        execCommand('justify' + value);
        break;
      case 'list':
        execCommand(value === 'bullet' ? 'insertUnorderedList' : 'insertOrderedList');
        break;
      default:
        execCommand(format);
        break;
    }
    
    setShowFormatting(false);
  };

  // Color picker handlers
  const handleColorPickerOpen = (event) => {
    setColorPickerAnchor(event.currentTarget);
  };

  const handleColorPickerClose = () => {
    setColorPickerAnchor(null);
  };

  const handleColorChange = (color) => {
    setSelectedColor(color.hex);
    insertFormatting('color', color.hex);
    handleColorPickerClose();
  };

  // Font size handlers
  const handleFontSizeOpen = (event) => {
    setFontSizeAnchor(event.currentTarget);
  };

  const handleFontSizeClose = () => {
    setFontSizeAnchor(null);
  };

  const handleFontSizeSelect = (size) => {
    insertFormatting('size', size);
    handleFontSizeClose();
  };

  // Alignment handlers
  const handleAlignmentOpen = (event) => {
    setAlignmentAnchor(event.currentTarget);
  };

  const handleAlignmentClose = () => {
    setAlignmentAnchor(null);
  };

  const handleAlignmentSelect = (alignment) => {
    insertFormatting('alignment', alignment);
    handleAlignmentClose();
  };

  // Link insertion handlers
  const handleLinkDialogOpen = () => {
    const selection = window.getSelection();
    if (selection) {
      setLinkText(selection.toString());
    }
    setInsertLinkDialogOpen(true);
  };

  const handleLinkDialogClose = () => {
    setInsertLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  const insertLink = () => {
    if (linkUrl) {
      contentRef.current.focus();
      if (linkText) {
        // If there's text, replace selection with linked text
        document.execCommand('insertHTML', false, 
          `<a href="${linkUrl}" target="_blank">${linkText}</a>`);
      } else {
        // Otherwise just insert the URL as a link
        document.execCommand('createLink', false, linkUrl);
      }
      
      // Update content state
      setNoteContent(contentRef.current.innerHTML);
      handleLinkDialogClose();
    }
  };

  // Image insertion handler
  const handleImageInsert = () => {
    fileInputRef.current.click();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = `<img src="${event.target.result}" alt="Inserted image" style="max-width: 100%" />`;
        document.execCommand('insertHTML', false, img);
        
        // Update content state
        setNoteContent(contentRef.current.innerHTML);
      };
      reader.readAsDataURL(file);
    }
    
    // Reset file input
    e.target.value = null;
  };

  // History navigation (undo/redo)
  const handleUndo = () => {
    if (historyPosition > 0) {
      const newPosition = historyPosition - 1;
      setHistoryPosition(newPosition);
      if (contentRef.current) {
        contentRef.current.innerHTML = noteHistory[newPosition];
      }
    }
  };

  const handleRedo = () => {
    if (historyPosition < noteHistory.length - 1) {
      const newPosition = historyPosition + 1;
      setHistoryPosition(newPosition);
      if (contentRef.current) {
        contentRef.current.innerHTML = noteHistory[newPosition];
      }
    }
  };

  // Save and load notes
  const handleSave = () => {
    setFileDialogOpen(true);
  };
  
  const saveNote = async () => {
    if (!currentUser) {
      setSnackbarMessage('Please login to save notes');
      setSnackbarOpen(true);
      return;
    }
    
    if (noteName.trim() === '') {
      setSnackbarMessage('Please enter a name for your note');
      setSnackbarOpen(true);
      return;
    }
    
    const newNote = {
      name: noteName,
      content: contentRef.current.innerHTML,
      date: new Date().toISOString()
    };
    
    try {
      const database = getDatabase();
      // Update the path to match the required structure
      const noteRef = ref(database, `users/${currentUser.uid}/notes/usermade/${noteName}`);
      await set(noteRef, newNote);
      
      setFileDialogOpen(false);
      setNoteName('');
      setSnackbarMessage('Note saved successfully!');
      setSnackbarOpen(true);
      
      // Reload notes after saving
      loadNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      setSnackbarMessage('Failed to save note. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Modify loadNotes function
  const loadNotes = async () => {
    if (!currentUser) return;
    
    try {
      const database = getDatabase();
      // Update the path to match the required structure
      const notesRef = ref(database, `users/${currentUser.uid}/notes/usermade`);
      const snapshot = await get(notesRef);
      
      if (snapshot.exists()) {
        const notesData = snapshot.val();
        const notesArray = Object.values(notesData);
        setSavedNotes(notesArray);
      } else {
        setSavedNotes([]);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      setSnackbarMessage('Failed to load notes. Please try again.');
      setSnackbarOpen(true);
    }
  };

  
  // Load saved notes when component mounts
  useEffect(() => {
    if (currentUser) {
      loadNotes();
    } else {
      setSavedNotes([]); // Clear notes when user is not logged in
    }
  }, [currentUser]);
  
  const handleLoadNote = (index) => {
    const loadedNote = savedNotes[index];
    if (contentRef.current && loadedNote) {
      contentRef.current.innerHTML = loadedNote.content;
      setNoteContent(loadedNote.content);
      
      // Add to history
      const newHistory = [...noteHistory, loadedNote.content];
      setNoteHistory(newHistory);
      setHistoryPosition(newHistory.length - 1);
      
      setFileDialogOpen(false);
      setSnackbarMessage(`Loaded note: ${loadedNote.name}`);
      setSnackbarOpen(true);
    }
  };
  
  const handleDeleteNote = async (index) => {
    if (!currentUser) return;
    
    const noteToDelete = savedNotes[index];
    try {
      const database = getDatabase();
      // Update the path to match the required structure
      const noteRef = ref(database, `users/${currentUser.uid}/notes/usermade/${noteToDelete.name}`);
      await remove(noteRef);
      
      setSnackbarMessage('Note deleted successfully');
      setSnackbarOpen(true);
      
      // Reload notes after deletion
      loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      setSnackbarMessage('Failed to delete note. Please try again.');
      setSnackbarOpen(true);
    }
  };

  // Clear formatting
  const clearFormatting = () => {
    document.execCommand('removeFormat');
    contentRef.current.focus();
    setNoteContent(contentRef.current.innerHTML);
  };

  // Print note
  const printNote = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Note</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>
          ${contentRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Insert emoji
  const handleEmojiClick = () => {
    const emojis = ['😊', '😂', '❤️', '👍', '🎉', '🔥', '✅', '⭐', '📝', '👀'];
    const emojiSelector = prompt('Select an emoji number (1-10):\n1:😊 2:😂 3:❤️ 4:👍 5:🎉\n6:🔥 7:✅ 8:⭐ 9:📝 10:👀');
    
    if (emojiSelector && !isNaN(parseInt(emojiSelector))) {
      const index = parseInt(emojiSelector) - 1;
      if (index >= 0 && index < emojis.length) {
        document.execCommand('insertText', false, emojis[index]);
        setNoteContent(contentRef.current.innerHTML);
      }
    }
  };

  return (
    <Box>
      
      {/* Main toolbar */}
      <ToolbarContainer>
        <Tooltip title="Save">
          <IconButton onClick={handleSave}>
            <SaveIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Open">
          <IconButton onClick={() => setFileDialogOpen(true)}>
            <FolderOpenIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title="Undo">
          <span>
            <IconButton onClick={handleUndo} disabled={historyPosition <= 0}>
              <UndoIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Redo">
          <span>
            <IconButton onClick={handleRedo} disabled={historyPosition >= noteHistory.length - 1}>
              <RedoIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title="Bold">
          <IconButton onClick={() => execCommand('bold')}>
            <FormatBoldIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Italic">
          <IconButton onClick={() => execCommand('italic')}>
            <FormatItalicIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Underline">
          <IconButton onClick={() => execCommand('underline')}>
            <FormatUnderlinedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Strikethrough">
          <IconButton onClick={() => execCommand('strikeThrough')}>
            <FormatStrikethroughIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Text Color">
          <IconButton onClick={handleColorPickerOpen}>
            <FormatColorTextIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Font Size">
          <IconButton onClick={handleFontSizeOpen}>
            <FormatSizeIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title="Text Alignment">
          <IconButton onClick={handleAlignmentOpen}>
            <FormatAlignLeftIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Bullet List">
          <IconButton onClick={() => insertFormatting('list', 'bullet')}>
            <FormatListBulletedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Numbered List">
          <IconButton onClick={() => insertFormatting('list', 'number')}>
            <FormatListNumberedIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title="Insert Link">
          <IconButton onClick={handleLinkDialogOpen}>
            <InsertLinkIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Insert Image">
          <IconButton onClick={handleImageInsert}>
            <InsertPhotoIcon />
          </IconButton>
        </Tooltip>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleImageUpload}
        />
        <Tooltip title="Insert Emoji">
          <IconButton onClick={handleEmojiClick}>
            <InsertEmoticonIcon />
          </IconButton>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title="Clear Formatting">
          <IconButton onClick={clearFormatting}>
            <ClearIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Print">
          <IconButton onClick={printNote}>
            <PrintIcon />
          </IconButton>
        </Tooltip>
      </ToolbarContainer>

      {/* Main note area */}
      <LinedPaper elevation={0}>
        <div
          ref={contentRef}
          className="content"
          contentEditable
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          onInput={(e) => setNoteContent(e.target.innerHTML)}
        />
        {!noteContent && (
          <div className="placeholder">
            <span style={{ fontSize: '20px' }}>📝</span>
            <span>Type to start making notes...</span>
          </div>
        )}
      </LinedPaper>

      {/* Floating format bar on text selection */}
      {showFormatting && (
        <FloatingFormatBar
          sx={{
            top: formatPosition.top,
            left: formatPosition.left,
          }}
        >
          <Tooltip title="Bold">
            <IconButton size="small" onClick={() => execCommand('bold')}>
              <FormatBoldIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic">
            <IconButton size="small" onClick={() => execCommand('italic')}>
              <FormatItalicIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Underline">
            <IconButton size="small" onClick={() => execCommand('underline')}>
              <FormatUnderlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Text Color">
            <IconButton size="small" onClick={handleColorPickerOpen}>
              <FormatColorTextIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add Link">
            <IconButton size="small" onClick={handleLinkDialogOpen}>
              <InsertLinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </FloatingFormatBar>
      )}

      {/* Color picker popover */}
      <Popover
        open={Boolean(colorPickerAnchor)}
        anchorEl={colorPickerAnchor}
        onClose={handleColorPickerClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <SketchPicker
          color={selectedColor}
          onChangeComplete={handleColorChange}
        />
      </Popover>

      {/* Font size menu */}
      <Menu
        anchorEl={fontSizeAnchor}
        open={Boolean(fontSizeAnchor)}
        onClose={handleFontSizeClose}
      >
        {[1, 2, 3, 4, 5, 6, 7].map((size) => (
          <MenuItem key={size} onClick={() => handleFontSizeSelect(size)}>
            <Typography style={{ fontSize: `${size * 2 + 8}px` }}>
              {size === 1 ? 'Small' : size === 4 ? 'Medium' : size === 7 ? 'Large' : `Size ${size}`}
            </Typography>
          </MenuItem>
        ))}
      </Menu>

      {/* Alignment menu */}
      <Menu
        anchorEl={alignmentAnchor}
        open={Boolean(alignmentAnchor)}
        onClose={handleAlignmentClose}
      >
        <MenuItem onClick={() => handleAlignmentSelect('Left')}>
          <FormatAlignLeftIcon sx={{ mr: 1 }} /> Left
        </MenuItem>
        <MenuItem onClick={() => handleAlignmentSelect('Center')}>
          <FormatAlignCenterIcon sx={{ mr: 1 }} /> Center
        </MenuItem>
        <MenuItem onClick={() => handleAlignmentSelect('Right')}>
          <FormatAlignRightIcon sx={{ mr: 1 }} /> Right
        </MenuItem>
      </Menu>

      {/* Link insertion dialog */}
      <Dialog open={insertLinkDialogOpen} onClose={handleLinkDialogClose}>
        <DialogTitle>Insert Link</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Link URL"
            type="url"
            fullWidth
            variant="outlined"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
          />
          <TextField
            margin="dense"
            label="Link Text (optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={linkText}
            onChange={(e) => setLinkText(e.target.value)}
            placeholder="Display text"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLinkDialogClose}>Cancel</Button>
          <Button onClick={insertLink} color="primary">Insert</Button>
        </DialogActions>
      </Dialog>

      {/* File dialog (Save/Open) */}
      <Dialog open={fileDialogOpen} onClose={() => setFileDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Notes Manager</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Save Current Note</Typography>
            <TextField
              fullWidth
              label="Note Name"
              value={noteName}
              onChange={(e) => setNoteName(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ mb: 1 }}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={saveNote}
              startIcon={<SaveIcon />}
            >
              Save
            </Button>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>Your Saved Notes</Typography>
          {savedNotes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No saved notes yet
            </Typography>
          ) : (
            <Box sx={{ maxHeight: '200px', overflow: 'auto' }}>
              {savedNotes.map((note, index) => (
                <Paper 
                  key={index} 
                  sx={{ 
                    p: 1, 
                    mb: 1, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <Box>
                    <Typography variant="body1">{note.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(note.date).toLocaleString()}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={() => handleLoadNote(index)} 
                      color="primary"
                    >
                      <FolderOpenIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteNote(index)} 
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFileDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Status notification */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserNotes;