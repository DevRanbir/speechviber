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
import GrammarIcon from '@mui/icons-material/Grading';

const GrammarCheckHistory = ({ grammarCheckHistory, formatDate, getScoreColor, navigate }) => {
  return (
    <>
      {grammarCheckHistory.length === 0 ? (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 5, 
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: 'background.paper'
          }}
        >
          <GrammarIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Grammar Check History Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You haven't used the grammar checker yet. Start checking your grammar to improve your writing!
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/grammar-check')}
            size="large"
          >
            Use Grammar Check
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Total Checks
                  </Typography>
                  <Typography variant="h3" color="primary.main">
                    {grammarCheckHistory.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Average Grammar Score
                  </Typography>
                  <Typography 
                    variant="h3" 
                    color={getScoreColor(grammarCheckHistory.reduce((acc, curr) => acc + curr.grammarScore, 0) / grammarCheckHistory.length)}
                  >
                    {Math.round(grammarCheckHistory.reduce((acc, curr) => acc + curr.grammarScore, 0) / grammarCheckHistory.length)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card elevation={3} sx={{ borderRadius: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Average Structure Score
                  </Typography>
                  <Typography 
                    variant="h3" 
                    color={getScoreColor(grammarCheckHistory.reduce((acc, curr) => acc + curr.structureScore, 0) / grammarCheckHistory.length)}
                  >
                    {Math.round(grammarCheckHistory.reduce((acc, curr) => acc + curr.structureScore, 0) / grammarCheckHistory.length)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="h5" gutterBottom>
                Grammar Check History
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><Typography fontWeight="bold">Date</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Grammar Score</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Structure Score</Typography></TableCell>
                    <TableCell><Typography fontWeight="bold">Punctuation Score</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grammarCheckHistory.map((check) => (
                    <TableRow key={check.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarTodayIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                          {formatDate(check.time)}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${check.grammarScore}/100`} 
                          size="small" 
                          sx={{ 
                            bgcolor: getScoreColor(check.grammarScore),
                            color: 'white',
                            fontWeight: 'bold'
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${check.structureScore}/100`} 
                          size="small" 
                          sx={{ 
                            bgcolor: getScoreColor(check.structureScore),
                            color: 'white',
                            fontWeight: 'bold'
                          }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${check.punctuationScore}/100`} 
                          size="small" 
                          sx={{ 
                            bgcolor: getScoreColor(check.punctuationScore),
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

export default GrammarCheckHistory;