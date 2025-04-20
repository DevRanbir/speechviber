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
import MicIcon from '@mui/icons-material/Mic';
import ScoreIcon from '@mui/icons-material/Score';

const FastTrackHistory = ({ fastTrackHistory, formatDate, getScoreColor, navigate }) => {
  return (
    <>
      {fastTrackHistory.length === 0 ? (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 5, 
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          <MicIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No FastTrack Analysis History Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You haven't completed any FastTrack Analysis sessions yet. Start practicing to improve your speaking skills!
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/analysis')}
            size="large"
          >
            Start FastTrack Analysis
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Sessions
                  </Typography>
                  <Typography variant="h3" color="primary.main">
                    {fastTrackHistory.length}
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
                    color={getScoreColor(fastTrackHistory.reduce((acc, curr) => acc + curr.averageScore, 0) / fastTrackHistory.length)}
                  >
                    {Math.round(fastTrackHistory.reduce((acc, curr) => acc + curr.averageScore, 0) / fastTrackHistory.length)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Highest Score
                  </Typography>
                  <Typography variant="h3" color="success.main">
                    {Math.max(...fastTrackHistory.map(item => item.averageScore))}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="h5" gutterBottom>
                FastTrack Analysis Sessions
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><Typography fontWeight="bold">Date</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Average Score</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Questions</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fastTrackHistory.map((session) => (
                    <TableRow key={session.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                          {formatDate(session.time)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${session.averageScore}%`} 
                          size="small" 
                          sx={{ 
                            bgcolor: getScoreColor(session.averageScore),
                            color: 'white',
                            fontWeight: 'bold'
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={session.questionScores ? session.questionScores.length : 0} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
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

export default FastTrackHistory;
                  