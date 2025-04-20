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
import SpellcheckIcon from '@mui/icons-material/Spellcheck';

const WordPowerHistory = ({ wordPowerGames, formatDate, getScoreColor, navigate }) => {
  return (
    <>
      {wordPowerGames.length === 0 ? (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 5, 
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          <SpellcheckIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Word Power History Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You haven't completed any Word Power games yet. Start playing to build your vocabulary!
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/word-power')}
            size="large"
          >
            Play Word Power
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Games
                  </Typography>
                  <Typography variant="h3" color="primary.main">
                    {wordPowerGames.length}
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
                  <Typography variant="h3" color="info.main">
                    {Math.round(wordPowerGames.reduce((acc, curr) => acc + curr.score, 0) / wordPowerGames.length)}
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
                    {wordPowerGames.reduce((acc, curr) => acc + curr.attemptedQuestions, 0)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="h5" gutterBottom>
                Word Power Game Sessions
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><Typography fontWeight="bold">Date</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Difficulty</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Questions</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Score</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {wordPowerGames.map((game) => (
                    <TableRow key={game.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                          {formatDate(game.time)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${game.difficulty}/10`} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={game.attemptedQuestions} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={game.score} 
                          size="small" 
                          sx={{ 
                            bgcolor: 'info.main',
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

export default WordPowerHistory;