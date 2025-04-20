import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TableContainer, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Chip 
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';

const WordInContextHistory = ({ history, formatDate, getScoreColor }) => {
  return (
    <>
      {history.length === 0 ? (
        <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
          <MenuBookIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Word Context History Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start practicing with Word in Context exercises to build your history!
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Words Practiced</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Performance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{formatDate(session.time)}</TableCell>
                  <TableCell>{session.wordsCount || 0}</TableCell>
                  <TableCell>
                    <Typography color={getScoreColor(session.score)}>
                      {session.score}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={session.score >= 80 ? "Excellent" : session.score >= 60 ? "Good" : "Needs Practice"}
                      color={session.score >= 80 ? "success" : session.score >= 60 ? "warning" : "error"}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};

export default WordInContextHistory;