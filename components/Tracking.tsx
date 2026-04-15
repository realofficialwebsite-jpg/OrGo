import React, { useState } from 'react';
import { Booking } from '../src/types';
import { UserBookingDetails } from './UserBookingDetails';
import { WorkerActiveJob } from './WorkerActiveJob';

interface TrackingProps {
  order: Booking;
  userRole: 'customer' | 'professional';
  onBack?: () => void;
  onCompleteJob?: () => void;
}

export const Tracking: React.FC<TrackingProps> = ({ order, userRole, onBack, onCompleteJob }) => {
  if (userRole === 'customer') {
    return (
      <UserBookingDetails 
        orderId={order.id} 
        onBack={onBack || (() => {})} 
      />
    );
  }

  return (
    <WorkerActiveJob 
      orderId={order.id} 
      onBack={onBack || (() => {})} 
      onCompleteJob={onCompleteJob || (() => {})} 
    />
  );
};
