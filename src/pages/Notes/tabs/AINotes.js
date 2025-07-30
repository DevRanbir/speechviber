import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Paper,
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Alert,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Slider,
  FormControlLabel,
  Switch,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import SaveIcon from '@mui/icons-material/Save';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SettingsIcon from '@mui/icons-material/Settings';
import ArticleIcon from '@mui/icons-material/Article';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SubjectIcon from '@mui/icons-material/Subject';
import QuizIcon from '@mui/icons-material/Quiz';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import BorderColorIcon from '@mui/icons-material/BorderColor';
import { useAuth } from '../../../contexts/AuthContext';
import { getDatabase, ref, set, get, remove } from 'firebase/database';
import { getGroqApiKey2Synch, getGroqApiUrlSynch } from '../../../utils/apiKeys';

// API Configuration - now loaded from Firebase
const getApiKey = () => getGroqApiKey2Synch();
const getApiUrl = () => getGroqApiUrlSynch();

const LinedPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  minHeight: '60vh',
  background: theme.palette.background.paper,
  position: 'relative',
  boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '40px',
    width: '1px',
    height: '100%',
    background: 'rgba(0,0,0,0.05)',
    zIndex: 0,
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
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    resize: 'none',
    position: 'relative',
    zIndex: 1,
    '&:focus': {
      outline: 'none',
    },
    '& h1': {
      fontSize: '28px',
      marginBottom: '24px',
      fontWeight: 600,
      color: theme.palette.primary.main,
      borderBottom: `2px solid ${theme.palette.primary.light}`,
      paddingBottom: '8px',
    },
    '& h2': {
      fontSize: '24px',
      marginBottom: '18px',
      marginTop: '32px',
      fontWeight: 500,
      color: theme.palette.secondary.dark,
    },
    '& h3': {
      fontSize: '20px',
      marginTop: '24px',
      marginBottom: '14px',
      fontWeight: 500,
      color: theme.palette.text.primary,
    },
    '& h4': {
      fontSize: '18px',
      marginTop: '20px',
      marginBottom: '10px',
      fontWeight: 500,
      color: theme.palette.text.secondary,
    },
    '& p': {
      marginBottom: '16px',
      lineHeight: '1.8',
      fontSize: '16px',
    },
    '& ul, & ol': {
      paddingLeft: '24px',
      marginBottom: '20px',
      '& li': {
        marginBottom: '10px',
        lineHeight: '1.6',
        '&::marker': {
          color: theme.palette.primary.main,
        }
      }
    },
    '& blockquote': {
      borderLeft: `4px solid ${theme.palette.primary.light}`,
      paddingLeft: '16px',
      fontStyle: 'italic',
      color: theme.palette.text.secondary,
      margin: '20px 0',
      background: 'rgba(0,0,0,0.02)',
      padding: '12px 16px',
      borderRadius: '4px',
    },
    '& strong': {
      fontWeight: 600,
      color: theme.palette.primary.dark,
    },
    '& em': {
      color: theme.palette.secondary.dark,
    },
    '& .note-highlight': {
      backgroundColor: 'rgba(255, 236, 179, 0.4)',
      padding: '2px 4px',
      borderRadius: '3px',
    },
    '& .note-definition': {
      backgroundColor: 'rgba(200, 230, 201, 0.4)',
      padding: '12px 16px',
      borderRadius: '6px',
      marginBottom: '16px',
      border: '1px solid rgba(200, 230, 201, 0.8)',
    },
    '& .note-example': {
      backgroundColor: 'rgba(179, 229, 252, 0.3)',
      padding: '12px 16px',
      borderRadius: '6px',
      marginBottom: '16px',
      border: '1px solid rgba(179, 229, 252, 0.7)',
    },
    '& .note-summary': {
      backgroundColor: 'rgba(225, 190, 231, 0.2)',
      padding: '16px',
      borderRadius: '6px',
      marginTop: '24px',
      border: '1px solid rgba(225, 190, 231, 0.5)',
    },
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
      borderBottom: `1px dotted ${theme.palette.primary.main}`,
      transition: 'all 0.2s ease',
      '&:hover': {
        color: theme.palette.primary.dark,
        borderBottom: `1px solid ${theme.palette.primary.dark}`,
      }
    }
  }
}));

const ToolbarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(0.5),
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius * 2,
  background: theme.palette.background.paper,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  marginBottom: theme.spacing(2),
}));

const OptionsContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  background: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
}));

const AINotesTab = () => {
  const [noteContent, setNoteContent] = useState('');
  const [isEditable, setIsEditable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [savedNotes, setSavedNotes] = useState([]);
  const [noteName, setNoteName] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [insertLinkDialogOpen, setInsertLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const { currentUser } = useAuth();

  // AI Generation options
  const [topic, setTopic] = useState('');
  const [format, setFormat] = useState('bullet');
  const [contentLength, setContentLength] = useState(5);
  const [includeExamples, setIncludeExamples] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [difficulty, setDifficulty] = useState('intermediate');
  const [noteTheme, setNoteTheme] = useState('default');
  
  const contentRef = useRef(null);

  // Format options - removed table format
  const formatOptions = [
    { value: 'bullet', label: 'Bullet Points', icon: <FormatListBulletedIcon /> },
    { value: 'paragraph', label: 'Paragraphs', icon: <SubjectIcon /> },
    { value: 'qa', label: 'Q&A Format', icon: <QuizIcon /> },
    { value: 'comprehensive', label: 'Comprehensive Notes', icon: <ArticleIcon /> }
  ];
  
  // Difficulty options
  const difficultyOptions = [
    { value: 'basic', label: 'Basic' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];
  
  // Visual theme options
  const themeOptions = [
    { value: 'default', label: 'Default', primaryColor: '#1976d2' },
    { value: 'forest', label: 'Forest', primaryColor: '#388e3c' },
    { value: 'sunset', label: 'Sunset', primaryColor: '#e65100' },
    { value: 'ocean', label: 'Ocean', primaryColor: '#0277bd' },
    { value: 'royal', label: 'Royal', primaryColor: '#6a1b9a' }
  ];

  // Load saved notes when component mounts
  useEffect(() => {
    if (currentUser) {
      loadNotes();
    } else {
      setSavedNotes([]); // Clear notes when user is not logged in
    }
  }, [currentUser]);
  
  // Apply note theme styling
  useEffect(() => {
    if (contentRef.current) {
      const themeColors = {
        default: { primary: '#1976d2', secondary: '#9c27b0', highlight: 'rgba(255, 236, 179, 0.4)' },
        forest: { primary: '#388e3c', secondary: '#5d4037', highlight: 'rgba(220, 237, 200, 0.4)' },
        sunset: { primary: '#e65100', secondary: '#7b1fa2', highlight: 'rgba(255, 224, 178, 0.4)' },
        ocean: { primary: '#0277bd', secondary: '#00695c', highlight: 'rgba(179, 229, 252, 0.4)' },
        royal: { primary: '#6a1b9a', secondary: '#283593', highlight: 'rgba(225, 190, 231, 0.4)' }
      };
      
      const colors = themeColors[noteTheme] || themeColors.default;
      
      contentRef.current.style.setProperty('--primary-color', colors.primary);
      contentRef.current.style.setProperty('--secondary-color', colors.secondary);
      contentRef.current.style.setProperty('--highlight-color', colors.highlight);
    }
  }, [noteTheme, noteContent]);

  // Load saved notes from localStorage
  const loadNotes = async () => {
    if (!currentUser) return;
    
    try {
      const database = getDatabase();
      const notesRef = ref(database, `users/${currentUser.uid}/notes/ainotes`);
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

  // Generate AI notes
  const generateNotes = async () => {
    if (!topic.trim()) {
      setSnackbarMessage('Please enter a topic');
      setSnackbarOpen(true);
      return;
    }
    
    setLoading(true);
    
    let prompt = `Generate visually beautiful, well-structured educational notes about "${topic}" in `;
    
    // Format specific instructions
    switch (format) {
      case 'bullet':
        prompt += `bullet point format with ${contentLength} main points. Use hierarchical structure with main points and sub-points, and ensure the formatting is visually appealing.`;
        break;
      case 'paragraph':
        prompt += `paragraph format with approximately ${contentLength} paragraphs. Include clear headings and ensure good visual organization.`;
        break;
      case 'qa':
        prompt += `question and answer format with ${contentLength} key questions and detailed answers. Make the questions stand out visually.`;
        break;
      case 'comprehensive':
        prompt += `comprehensive notes format with ${contentLength} sections including introduction and conclusion. Use proper hierarchy with headings and subheadings.`;
        break;
      default:
        prompt += `clear and organized format with visual emphasis on key concepts.`;
    }
    
    // Additional options
    prompt += ` Difficulty level: ${difficulty}.`;
    if (includeExamples) prompt += ` Include examples to illustrate concepts and wrap them in a "note-example" class div for styling.`;
    if (includeSummary) prompt += ` Include a brief summary at the end and wrap it in a "note-summary" class div for styling.`;
    
    prompt += ` Use the following HTML elements for styling: 
    - Wrap important definitions in a div with class "note-definition"
    - Use span with class "note-highlight" for key terms or important phrases
    - Use proper headings (h1 for title, h2 for main sections, h3 for subsections)
    - Create visually appealing lists with proper spacing
    - Add blockquotes for important quotes or insights
    - Use bold and italic formatting judiciously to highlight important information
    
    Format the response using HTML for proper styling, making sure the notes are beautiful, engaging, and easy to read.`;
    
    // Debug logging
    console.log('API_URL:', getApiUrl());
    console.log('API_KEY:', getApiKey() ? 'Present' : 'Missing');
    
    try {
      const response = await fetch(getApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getApiKey()}`
        },
        body: JSON.stringify({
          model: "gemma2-9b-it",
          messages: [
            {
              role: "system", 
              content: "You are an educational AI assistant specialized in creating high-quality, visually appealing study notes. Your notes should be accurate, well-structured, and beautifully formatted with HTML elements for visual appeal. Focus on creating notes that are not just informative but visually engaging."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2048
        })
      });
      
      const data = await response.json();
      
      if (data.choices && data.choices[0]?.message?.content) {
        // Get content and enhance with custom styling
        let generatedContent = data.choices[0].message.content;
        
        // Make sure it's proper HTML
        if (!generatedContent.trim().startsWith('<')) {
          // If it's markdown or plain text, wrap in paragraphs
          generatedContent = `<h1>${topic}</h1>` + generatedContent
            .split('\n\n')
            .map(para => para.trim() ? `<p>${para}</p>` : '')
            .join('');
        }
        
        // Enhance lists, add icons, and improve visual styling
        generatedContent = enhanceNotesVisuals(generatedContent, topic);
        
        // Set content
        if (contentRef.current) {
          contentRef.current.innerHTML = generatedContent;
          setNoteContent(generatedContent);
        }
        
        // Set default note name
        const defaultName = `${topic} - ${formatOptions.find(f => f.value === format)?.label || format}`;
        setNoteName(defaultName);
      } else {
        throw new Error("Failed to generate content");
      }
    } catch (error) {
      console.error("Error generating AI notes:", error);
      console.error("API_URL was:", getApiUrl());
      console.error("API_KEY present:", !!getApiKey());
      setSnackbarMessage('Error generating notes. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Enhance the visual appearance of generated notes
  const enhanceNotesVisuals = (content, topic) => {
    // Make sure the topic title exists as H1
    if (!content.includes('<h1>')) {
      content = `<h1>${topic}</h1>` + content;
    }
    
    // Add icons to lists if they don't already have styling
    content = content.replace(/<ul>/g, '<ul style="list-style-type: none; padding-left: 5px;">');
    content = content.replace(/<li>/g, '<li style="position: relative; padding-left: 28px; margin-bottom: 12px;"><span style="position: absolute; left: 0; color: var(--primary-color, #1976d2);">•</span>');
    
    // Add styling to blockquotes if they don't have it
    content = content.replace(/<blockquote>/g, '<blockquote style="border-left: 4px solid var(--primary-color, #1976d2); padding-left: 16px; font-style: italic; color: #555; margin: 20px 0; background: rgba(0,0,0,0.02); padding: 12px 16px; border-radius: 4px;">');
    
    // Make sure example blocks have proper styling
    if (!content.includes('note-example')) {
      content = content.replace(/<h3>Example/g, '<div class="note-example"><h3>Example');
      content = content.replace(/<h4>Example/g, '<div class="note-example"><h4>Example');
      content = content.replace(/Example:<\/h3>/g, 'Example:</h3>');
      content = content.replace(/Example:<\/h4>/g, 'Example:</h4>');
      
      // Close example divs before the next heading
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const examples = tempDiv.querySelectorAll('.note-example');
      
      examples.forEach(example => {
        let nextElement = example.nextElementSibling;
        while (nextElement && !['H1', 'H2', 'H3', 'H4'].includes(nextElement.tagName)) {
          example.appendChild(nextElement);
          nextElement = example.nextElementSibling;
        }
      });
      
      content = tempDiv.innerHTML;
    }
    
    // Make sure summary blocks have proper styling
    if (!content.includes('note-summary') && content.includes('Summary')) {
      content = content.replace(/<h2>Summary/g, '<div class="note-summary"><h2>Summary');
      content = content.replace(/<h3>Summary/g, '<div class="note-summary"><h3>Summary');
      
      // Close summary divs at the end
      if (content.includes('<div class="note-summary">')) {
        content += '</div>';
      }
    }
    
    // Add custom CSS for better styling
    content = `
      <style>
        :root {
          --primary-color: #1976d2; 
          --secondary-color: #9c27b0;
          --highlight-color: rgba(255, 236, 179, 0.4);
        }
        h1, h2, h3, h4 { 
          color: var(--primary-color);
          margin-top: 1.5em;
          margin-bottom: 0.8em;
        }
        h1 {
          font-size: 28px;
          border-bottom: 2px solid var(--primary-color);
          padding-bottom: 8px;
          margin-top: 0;
        }
        .note-definition {
          background-color: rgba(200, 230, 201, 0.4);
          padding: 12px 16px;
          border-radius: 6px;
          margin: 16px 0;
          border: 1px solid rgba(200, 230, 201, 0.8);
        }
        .note-example {
          background-color: rgba(179, 229, 252, 0.3);
          padding: 12px 16px;
          border-radius: 6px;
          margin: 16px 0;
          border: 1px solid rgba(179, 229, 252, 0.7);
        }
        .note-summary {
          background-color: rgba(225, 190, 231, 0.2);
          padding: 16px;
          border-radius: 6px;
          margin-top: 24px;
          border: 1px solid rgba(225, 190, 231, 0.5);
        }
        .note-highlight {
          background-color: var(--highlight-color);
          padding: 2px 4px;
          border-radius: 3px;
        }
        strong {
          color: var(--primary-color);
          font-weight: 600;
        }
        em {
          color: var(--secondary-color);
        }
      </style>
    ` + content;
    
    return content;
  };

  // Save note
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
      topic: topic,
      format: format,
      theme: noteTheme,
      date: new Date().toISOString()
    };
    
    try {
      const database = getDatabase();
      const noteRef = ref(database, `users/${currentUser.uid}/notes/ainotes/${noteName}`);
      await set(noteRef, newNote);
      
      setFileDialogOpen(false);
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
  
  // Load note
  const handleLoadNote = (index) => {
    const loadedNote = savedNotes[index];
    if (contentRef.current && loadedNote) {
      contentRef.current.innerHTML = loadedNote.content;
      setNoteContent(loadedNote.content);
      setTopic(loadedNote.topic || '');
      setFormat(loadedNote.format || 'bullet');
      setNoteTheme(loadedNote.theme || 'default');
      setNoteName(loadedNote.name);
      
      setFileDialogOpen(false);
      setSnackbarMessage(`Loaded note: ${loadedNote.name}`);
      setSnackbarOpen(true);
    }
  };
  
  // Delete note
  const handleDeleteNote = async (index) => {
    if (!currentUser) return;
    
    const noteToDelete = savedNotes[index];
    try {
      const database = getDatabase();
      const noteRef = ref(database, `users/${currentUser.uid}/notes/ainotes/${noteToDelete.name}`);
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
  
  // Execute formatting command
  const execCommand = (command, value = null) => {
    if (!isEditable) return;
    document.execCommand(command, false, value);
    contentRef.current.focus();
    setNoteContent(contentRef.current.innerHTML);
  };
  
  // Add special formatting
  const addFormattedElement = (type) => {
    if (!isEditable) return;
    
    const selection = window.getSelection();
    const selectedText = selection.toString();
    
    if (selectedText) {
      let html = '';
      
      switch(type) {
        case 'highlight':
          html = `<span class="note-highlight">${selectedText}</span>`;
          break;
        case 'definition':
          html = `<div class="note-definition">${selectedText}</div>`;
          break;
        case 'example':
          html = `<div class="note-example">${selectedText}</div>`;
          break;
        default:
          return;
      }
      
      document.execCommand('insertHTML', false, html);
      setNoteContent(contentRef.current.innerHTML);
    }
  };
  
  // Print note
  const printNote = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Note - ${topic}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
            h1 { color: #1976d2; border-bottom: 2px solid #1976d2; padding-bottom: 8px; }
            h2 { color: #1976d2; margin-top: 1.5em; }
            h3 { color: #1976d2; }
            h4 { color: #1976d2; }
            ul, ol { margin-top: 0.5em; }
            li { margin-bottom: 10px; }
            img { max-width: 100%; }
            .note-definition {
              background-color: rgba(200, 230, 201, 0.4);
              padding: 12px 16px;
              border-radius: 6px;
              margin: 16px 0;
              border: 1px solid rgba(200, 230, 201, 0.8);
            }
            .note-example {
              background-color: rgba(179, 229, 252, 0.3);
              padding: 12px 16px;
              border-radius: 6px;
              margin: 16px 0;
              border: 1px solid rgba(179, 229, 252, 0.7);
            }
            .note-summary {
              background-color: rgba(225, 190, 231, 0.2);
              padding: 16px;
              border-radius: 6px;
              margin-top: 24px;
              border: 1px solid rgba(225, 190, 231, 0.5);
            }
            .note-highlight {
              background-color: rgba(255, 236, 179, 0.4);
              padding: 2px 4px;
              border-radius: 3px;
            }
            blockquote {
              border-left: 4px solid #1976d2;
              padding-left: 16px;
              font-style: italic;
              color: #555;
              margin: 20px 0;
              background: rgba(0,0,0,0.02);
              padding: 12px 16px;
              border-radius: 4px;
            }
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
  
  // Link handling
  const handleLinkDialogOpen = () => {
    if (!isEditable) return;
    setInsertLinkDialogOpen(true);
  };

  const handleLinkDialogClose = () => {
    setInsertLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  const insertLink = () => {
    if (!isEditable) return;
    if (linkUrl) {
      contentRef.current.focus();
      if (linkText) {
        document.execCommand('insertHTML', false, 
          `<a href="${linkUrl}" target="_blank">${linkText}</a>`);
      } else {
        document.execCommand('createLink', false, linkUrl);
      }
      
      setNoteContent(contentRef.current.innerHTML);
      handleLinkDialogClose();
    }
  };

  return (
    <Box>
      {/* Options panel */}
      <OptionsContainer>
        <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" /> AI Notes Generator
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 2 }}>
          <TextField
            label="Topic"
            variant="outlined"
            fullWidth
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a subject or topic"
            sx={{ flexGrow: 2 }}
          />
          
          <FormControl variant="outlined" sx={{ minWidth: '200px' }}>
            <InputLabel>Format</InputLabel>
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              label="Format"
            >
              {formatOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {option.icon}
                    {option.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setSettingsDialogOpen(true)}
              startIcon={<SettingsIcon />}
              sx={{ height: '56px' }}
            >
              Options
            </Button>
            
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setThemeDialogOpen(true)}
              startIcon={<ColorLensIcon />}
              sx={{ height: '56px' }}
            >
              Theme
            </Button>
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            onClick={generateNotes}
            disabled={loading || !topic.trim()}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
            sx={{ height: '56px', minWidth: '160px' }}
          >
            {loading ? 'Generating...' : 'Generate Notes'}
          </Button>
        </Box>
        
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1 }}>
          {includeExamples && <Chip label="Include Examples" size="small" color="primary" variant="outlined" />}
          {includeSummary && <Chip label="Include Summary" size="small" color="primary" variant="outlined" />}
          <Chip label={difficultyOptions.find(d => d.value === difficulty)?.label || difficulty} size="small" color="secondary" variant="outlined" />
          <Chip 
            label={themeOptions.find(t => t.value === noteTheme)?.label || noteTheme} 
            size="small" 
            color="default" 
            variant="outlined"
            sx={{ 
              borderColor: themeOptions.find(t => t.value === noteTheme)?.primaryColor,
              color: themeOptions.find(t => t.value === noteTheme)?.primaryColor
            }}
          />
        </Box>
      </OptionsContainer>

      {/* Toolbar */}
      <ToolbarContainer>
        <Tooltip title="Save">
            <span>
                <IconButton onClick={handleSave} disabled={!noteContent}>
                <SaveIcon />
                </IconButton>
            </span>
        </Tooltip>
        <Tooltip title="Open">
        <span>
            <IconButton onClick={() => setFileDialogOpen(true)}>
              <FolderOpenIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title={isEditable ? "Editor Enabled" : "Editor Disabled"}>
        <span>
            <FormControlLabel
              control={
                <Switch 
                  checked={isEditable}
                  onChange={(e) => setIsEditable(e.target.checked)}
                  color="primary"
                />
              }
              label="Edit"
              sx={{ mx: 1 }}
            />
          </span>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title="Bold">
          <span>
            <IconButton onClick={() => execCommand('bold')} disabled={!isEditable}>
              <FormatBoldIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Italic">
          <span>
            <IconButton onClick={() => execCommand('italic')} disabled={!isEditable}>
              <FormatItalicIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Underline">
          <span>
            <IconButton onClick={() => execCommand('underline')} disabled={!isEditable}>
              <FormatUnderlinedIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Insert Link">
          <span>
            <IconButton onClick={handleLinkDialogOpen} disabled={!isEditable}>
              <InsertLinkIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title="Add Highlight">
          <span>
            <IconButton onClick={() => addFormattedElement('highlight')} disabled={!isEditable}>
              <BorderColorIcon sx={{ color: 'orange' }} />
            </IconButton>
          </span>
        </Tooltip>
        <Divider orientation="vertical" flexItem />
        <Tooltip title="Print">
            <span>
            <IconButton onClick={printNote} disabled={!noteContent}>
              <PrintIcon />
            </IconButton>
          </span>
        </Tooltip>
      </ToolbarContainer>

      {/* Main note area */}
      <LinedPaper elevation={0}>
        <div
          ref={contentRef}
          className="content"
          contentEditable={isEditable}
          dangerouslySetInnerHTML={{ __html: noteContent }}
        />
        
        {!noteContent && !loading && (
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'text.secondary'
          }}>
            <AutoAwesomeIcon sx={{ fontSize: 48, mb: 2, opacity: 0.7 }} />
            <Typography variant="h6">AI Generated Notes</Typography>
            <Typography variant="body2">
              Enter a topic and generate beautiful study notes
            </Typography>
          </Box>
        )}
        
        {loading && (
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            textAlign: 'center' 
          }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Creating beautiful notes for "{topic}"...
            </Typography>
          </Box>
        )}
      </LinedPaper>

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)}>
        <DialogTitle>Note Generation Settings</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
            Content Length
          </Typography>
          <Slider
            value={contentLength}
            onChange={(e, newValue) => setContentLength(newValue)}
            aria-labelledby="content-length-slider"
            valueLabelDisplay="auto"
            step={1}
            marks
            min={3}
            max={10}
            sx={{ mb: 3 }}
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Difficulty Level</InputLabel>
            <Select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              label="Difficulty Level"
            >
              {difficultyOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch 
                checked={includeExamples}
                onChange={(e) => setIncludeExamples(e.target.checked)}
                color="primary"
              />
            }
            label="Include Examples"
            sx={{ display: 'block', mt: 2 }}
          />
          
          <FormControlLabel
            control={
              <Switch 
                checked={includeSummary}
                onChange={(e) => setIncludeSummary(e.target.checked)}
                color="primary"
              />
            }
            label="Include Summary"
            sx={{ display: 'block', mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Theme Dialog */}
      <Dialog open={themeDialogOpen} onClose={() => setThemeDialogOpen(false)}>
        <DialogTitle>Visual Theme</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Choose a color theme for your notes
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {themeOptions.map((theme) => (
              <Button
                key={theme.value}
                variant={noteTheme === theme.value ? "contained" : "outlined"}
                onClick={() => setNoteTheme(theme.value)}
                startIcon={<ColorLensIcon />}
                sx={{ 
                  justifyContent: 'flex-start',
                  backgroundColor: noteTheme === theme.value ? theme.primaryColor : 'transparent',
                  borderColor: theme.primaryColor,
                  color: noteTheme === theme.value ? 'white' : theme.primaryColor,
                  '&:hover': {
                    backgroundColor: noteTheme === theme.value ? theme.primaryColor : `${theme.primaryColor}22`
                  }
                }}
              >
                {theme.label}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setThemeDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* File dialog (Save/Open) */}
      <Dialog open={fileDialogOpen} onClose={() => setFileDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>AI Notes Manager</DialogTitle>
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
              disabled={!noteContent}
            >
              Save
            </Button>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle1" gutterBottom>Your Saved AI Notes</Typography>
          {savedNotes.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No saved notes yet
            </Typography>
          ) : (
            <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
              {savedNotes.map((note, index) => (
                <Paper 
                  key={index} 
                  sx={{ 
                    p: 1, 
                    mb: 1, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: `4px solid ${themeOptions.find(t => t.value === (note.theme || 'default'))?.primaryColor || '#1976d2'}`
                  }}
                >
                  <Box>
                    <Typography variant="body1">{note.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(note.date).toLocaleString()}
                      </Typography>
                      {note.format && (
                        <Chip 
                          size="small" 
                          label={formatOptions.find(f => f.value === note.format)?.label || note.format}
                          icon={formatOptions.find(f => f.value === note.format)?.icon}
                        />
                      )}
                    </Box>
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

export default AINotesTab;