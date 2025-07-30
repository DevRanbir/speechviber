import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Stack,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Link
} from '@mui/material';
import { 
  Send as SendIcon, 
  Upload as UploadIcon,
  History as HistoryIcon,
  Create as CreateIcon,
  Image as ImageIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../../contexts/AuthContext';

const HelpDeskSection = () => {
  const { currentUser } = useAuth();
  const [issue, setIssue] = useState('');
  const [frequency, setFrequency] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [lastTicketNumber, setLastTicketNumber] = useState(0);

  const handleScreenshotChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setScreenshot(file);
    } else {
      setError('Please upload an image file');
    }
  };
  
  useEffect(() => {
    const database = getDatabase();
    const ticketsRef = ref(database, `users/${currentUser.uid}/support-tickets`);
    
    const unsubscribe = onValue(ticketsRef, (snapshot) => {
      if (snapshot.exists()) {
        const ticketsData = [];
        snapshot.forEach((childSnapshot) => {
          ticketsData.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        // Sort by creation date, newest first
        ticketsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setTickets(ticketsData);
        setLastTicketNumber(ticketsData.length);
      } else {
        setTickets([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser.uid]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
  
    try {
      const database = getDatabase();
      const storage = getStorage();
      let screenshotUrl = '';
  
      if (screenshot) {
        const imageRef = storageRef(storage, `users/${currentUser.uid}/support-tickets/${Date.now()}_${screenshot.name}`);
        await uploadBytes(imageRef, screenshot);
        screenshotUrl = await getDownloadURL(imageRef);
      }
  
      const newTicketNumber = lastTicketNumber + 1;
      const ticketId = `#${String(newTicketNumber).padStart(5, '0')}`;
  
      const ticketData = {
        ticketId,
        issue,
        frequency,
        screenshotUrl,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
  
      const userTicketsRef = ref(database, `users/${currentUser.uid}/support-tickets/${Date.now()}`);
      await set(userTicketsRef, ticketData);
  
      setLastTicketNumber(newTicketNumber);
      setIssue('');
      setFrequency('');
      setScreenshot(null);
      setSuccess(true);
    } catch (err) {
      setError('Failed to submit support ticket. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    try {
      const database = getDatabase();
      const ticketRef = ref(database, `users/${currentUser.uid}/support-tickets/${ticketId}`);
      await set(ticketRef, {
        ...tickets.find(t => t.id === ticketId),
        status: 'cancelled'
      });
    } catch (err) {
      setError('Failed to cancel ticket. Please try again.');
      console.error('Error:', err);
    }
  };

  const handleReinitializeTicket = async (ticketId) => {
    try {
      const database = getDatabase();
      const ticketRef = ref(database, `users/${currentUser.uid}/support-tickets/${ticketId}`);
      await set(ticketRef, {
        ...tickets.find(t => t.id === ticketId),
        status: 'pending'
      });
    } catch (err) {
      setError('Failed to reinitialize ticket. Please try again.');
      console.error('Error:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'resolved': return 'success';
      case 'in-progress': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Help & Support</Typography>
      
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab icon={<CreateIcon />} label="Submit Ticket" />
        <Tab icon={<HistoryIcon />} label="My Tickets" />
      </Tabs>

      {activeTab === 0 && (
        <>
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Your support ticket has been submitted successfully. We'll get back to you soon!
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Describe your issue"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                required
                disabled={loading}
              />

              <FormControl fullWidth required disabled={loading}>
                <InputLabel>How often does this issue occur?</InputLabel>
                <Select
                  value={frequency}
                  label="How often does this issue occur?"
                  onChange={(e) => setFrequency(e.target.value)}
                >
                  <MenuItem value="once">Once</MenuItem>
                  <MenuItem value="sometimes">Sometimes</MenuItem>
                  <MenuItem value="frequently">Frequently</MenuItem>
                  <MenuItem value="always">Always</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <input
                  accept="image/*"
                  type="file"
                  id="screenshot-upload"
                  style={{ display: 'none' }}
                  onChange={handleScreenshotChange}
                  disabled={loading}
                />
                <label htmlFor="screenshot-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadIcon />}
                    disabled={loading}
                    fullWidth
                  >
                    Upload Screenshot
                  </Button>
                </label>
                {screenshot && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    File selected: {screenshot.name}
                  </Typography>
                )}
              </Box>

              <Button
                type="submit"
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                disabled={loading || !issue || !frequency}
                fullWidth
              >
                {loading ? 'Submitting...' : 'Submit Support Ticket'}
              </Button>
            </Stack>
          </Box>
        </>
      )}

      {activeTab === 1 && (
        <Grid container spacing={2}>
          {tickets.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ textAlign: 'center', py: 4 }}>
                <CardContent>
                  <HistoryIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6">No Support Tickets</Typography>
                  <Typography color="text.secondary">
                    You haven't submitted any support tickets yet.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            tickets.map((ticket, index) => (
              <Grid item xs={12} key={ticket.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="div">
                        {ticket.ticketId || `Issue #${String(index + 1).padStart(5, '0')}`}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Chip 
                          label={ticket.status} 
                          color={getStatusColor(ticket.status)}
                          size="small"
                        />
                        {ticket.status === 'pending' && (
                          <Tooltip title="Cancel Ticket">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleCancelTicket(ticket.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        {ticket.status === 'cancelled' && (
                          <Tooltip title="Reinitialize Ticket">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleReinitializeTicket(ticket.id)}
                            >
                              <HistoryIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>
                    <Typography color="text.secondary" gutterBottom>
                      Submitted on: {new Date(ticket.createdAt).toLocaleString()}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {ticket.issue}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Chip 
                        label={`Frequency: ${ticket.frequency}`}
                        size="small"
                        variant="outlined"
                      />
                      {ticket.screenshotUrl && (
                        <Tooltip title="View Screenshot">
                          <Link href={ticket.screenshotUrl} target="_blank">
                            <IconButton size="small">
                              <ImageIcon />
                            </IconButton>
                          </Link>
                        </Tooltip>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Paper>
  );
};

export default HelpDeskSection;