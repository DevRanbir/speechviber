import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Divider, 
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ChatIcon from '@mui/icons-material/Chat';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const DebateHistory = ({ debateHistory, formatDate, getScoreColor, navigate }) => {
  return (
    <>
      {debateHistory.length === 0 ? (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 5, 
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          <ChatIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Debate History Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You haven't participated in any debates yet. Start debating to improve your persuasive skills!
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/debate')}
            size="large"
          >
            Start Debating
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Debates
                  </Typography>
                  <Typography variant="h3" color="primary.main">
                    {debateHistory.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Average Score
                  </Typography>
                  <Typography 
                    variant="h3" 
                    color={getScoreColor(debateHistory.reduce((acc, curr) => acc + curr.score, 0) / debateHistory.length)}
                  >
                    {Math.round(debateHistory.reduce((acc, curr) => acc + curr.score, 0) / debateHistory.length)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Win Rate
                  </Typography>
                  <Typography variant="h3" color="success.main">
                    {Math.round((debateHistory.filter(item => item.result === "victory").length / debateHistory.length) * 100)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="h5" gutterBottom>
                Debate Sessions
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><Typography fontWeight="bold">Date</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Topic</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Position</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Difficulty</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Score</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Result</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {debateHistory.map((session) => (
                    <TableRow key={session.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                          {formatDate(session.time)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography noWrap sx={{ maxWidth: 200 }}>
                          {session.topic}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={session.position} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={session.difficulty} 
                          size="small" 
                          color={
                            session.difficulty === "easy" ? "success" : 
                            session.difficulty === "medium" ? "warning" : "error"
                          } 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${session.score}%`} 
                          size="small" 
                          sx={{ 
                            bgcolor: getScoreColor(session.score),
                            color: 'white',
                            fontWeight: 'bold'
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={<EmojiEventsIcon />}
                          label={session.result} 
                          size="small" 
                          color={session.result === "victory" ? "success" : "error"}
                          sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </>
  );
};

export default DebateHistory;