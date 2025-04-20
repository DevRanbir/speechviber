import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';

const TongueTwisterHistory = ({ tongueTwisterHistory, formatDate, getScoreColor, navigate }) => {
  return (
    <>
      {tongueTwisterHistory?.length === 0 ? (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 5, 
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          <RecordVoiceOverIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Tongue Twister History Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You haven't practiced any tongue twisters yet. Start practicing to improve your pronunciation!
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/tongue-twister')}
            size="large"
          >
            Start Practice
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
                    {tongueTwisterHistory.length}
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
                    color={getScoreColor(tongueTwisterHistory.reduce((acc, curr) => acc + curr.score, 0) / tongueTwisterHistory.length)}
                  >
                    {Math.round(tongueTwisterHistory.reduce((acc, curr) => acc + curr.score, 0) / tongueTwisterHistory.length)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Correct Answers
                  </Typography>
                  <Typography variant="h3" color="success.main">
                    {tongueTwisterHistory.reduce((acc, curr) => acc + curr.correctCount, 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="h5" gutterBottom>
                Practice Sessions
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><Typography fontWeight="bold">Date</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Question Type</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Correct/Total</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Score</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Accuracy</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tongueTwisterHistory.map((session) => (
                    <TableRow key={session.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                          {formatDate(session.time)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={session.questionType} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                    <TableCell>
                        {`${session.correctCount}/${session.correctCount + session.incorrectCount}`}
                    </TableCell>
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
                                label={`${session.accuracy}%`}
                                size="small"
                                color={
                                session.accuracy >= 80 ? "success" :
                                session.accuracy >= 60 ? "success" : "success"
                                }
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

export default TongueTwisterHistory;