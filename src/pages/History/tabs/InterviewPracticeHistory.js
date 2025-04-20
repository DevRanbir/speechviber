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
import WorkIcon from '@mui/icons-material/Work';
import QuizIcon from '@mui/icons-material/Quiz';

const InterviewPracticeHistory = ({ mcqChallenges, formatDate, getScoreColor, navigate }) => {
  return (
    <>
      {mcqChallenges.length === 0 ? (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 5, 
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          <QuizIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Interview Practice History Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You haven't completed any interview practice sessions yet. Start practicing to build your history!
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/practice')}
            size="large"
          >
            Start Practicing
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Practices
                  </Typography>
                  <Typography variant="h3" color="primary.main">
                    {mcqChallenges.length}
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
                    color={getScoreColor(mcqChallenges.reduce((acc, curr) => acc + curr.score, 0) / mcqChallenges.length)}
                  >
                    {Math.round(mcqChallenges.reduce((acc, curr) => acc + curr.score, 0) / mcqChallenges.length)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Questions
                  </Typography>
                  <Typography variant="h3" color="info.main">
                    {mcqChallenges.reduce((acc, curr) => acc + curr.attemptedQuestions, 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="h5" gutterBottom>
                Interview Practice Sessions
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><Typography fontWeight="bold">Date</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Job Role</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Difficulty</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Questions</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Score</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {mcqChallenges.map((challenge) => (
                    <TableRow key={challenge.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                          {formatDate(challenge.time)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <WorkIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                          {challenge.jobRole}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={challenge.difficulty || 'N/A'} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={challenge.attemptedQuestions} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${challenge.score}%`} 
                          size="small" 
                          sx={{ 
                            bgcolor: getScoreColor(challenge.score),
                            color: 'white',
                            fontWeight: 'bold'
                          }} 
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

export default InterviewPracticeHistory;