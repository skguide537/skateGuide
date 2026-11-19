'use client';

import { useState } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { formatRelativeTime } from '@/utils/timeUtils';
import SkateparkModal from '../modals/SkateparkModal';
import { skateparkClient } from '@/services/skateparkClient';

interface CommentsTabProps {
  comments: any[];
  currentUserId?: string;
}

export default function CommentsTab({ comments }: CommentsTabProps) {
  const [selectedSkateparkId, setSelectedSkateparkId] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCommentClick = async (skateparkId: string) => {
    try {
      setSelectedSkateparkId(skateparkId);
      const skatepark = await skateparkClient.getSkateparkById(skateparkId);
      setModalData(skatepark);
      setModalOpen(true);
    } catch (error) {
      console.error('Failed to load skatepark:', error);
    }
  };

  if (comments.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No comments yet.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Recent Comments ({comments.length})
      </Typography>
      
      <Box>
        {comments.map((comment) => (
          <Card 
            key={comment.id} 
            sx={{ mb: 2, cursor: 'pointer' }}
            onClick={() => handleCommentClick(comment.skateparkId)}
          >
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {formatRelativeTime(comment.createdAt)}
                {comment.editedAt && ' (edited)'}
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 1 }}>
                {comment.body}
              </Typography>
              
              <Typography 
                sx={{ 
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                View skatepark: {comment.skateparkTitle}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {modalData && selectedSkateparkId && (
        <SkateparkModal
          _id={modalData._id}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={modalData.title}
          description={modalData.description}
          photoNames={modalData.photoNames || []}
          isPark={modalData.isPark}
          size={modalData.size}
          levels={modalData.levels || []}
          tags={modalData.tags || []}
          coordinates={{
            lat: modalData.location.coordinates[1],
            lng: modalData.location.coordinates[0]
          }}
          externalLinks={modalData.externalLinks}
          distanceKm={modalData.distanceKm || 0}
        />
      )}
    </Box>
  );
}

