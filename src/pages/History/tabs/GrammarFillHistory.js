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
import EditIcon from '@mui/icons-material/Edit';

const GrammarFillHistory = ({ history, formatDate, getScoreColor }) => {
  return (
    <>
      {history.length === 0 ? (
        <Paper elevation={3} sx={{ p: 5, textAlign: 'center', borderRadius: 2 }}>
          <EditIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Grammar Fill History Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Practice filling in grammar exercises to build your history!
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Questions Attempted</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Category</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{formatDate(session.time)}</TableCell>
                  <TableCell>{session.questionsCount || 0}</TableCell>
                  <TableCell>
                    <Typography color={getScoreColor(session.score)}>
                      {session.score}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={session.category || "General"}
                      color="primary"
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

export default GrammarFillHistory;