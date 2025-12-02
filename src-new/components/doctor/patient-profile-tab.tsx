
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AtSign, Cake, Droplet, Heart, Home, Phone, User as UserIcon, Users } from 'lucide-react';
import { differenceInYears } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const ProfileDetail = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4">
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="font-semibold">{value}</p>
      </div>
    </div>
  );
};

const ProfileSkeleton = () => (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
    <Card>
        <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
        {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className='w-full space-y-2'>
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-5 w-2/3" />
            </div>
            </div>
        ))}
        </CardContent>
    </Card>
    <Card>
        <CardHeader>
        <CardTitle>Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className='w-full space-y-2'>
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-5 w-2/3" />
                </div>
            </div>
        ))}
        </CardContent>
    </Card>
    </div>
);


export function PatientProfileTab({ patientId, patientProfile, isLoading }) {
  
  const getAge = (dob) => {
    if (!dob) return null;
    const date = dob.toDate ? dob.toDate() : new Date(dob);
    try {
      return differenceInYears(new Date(), date);
    } catch (e) {
      return null;
    }
  };

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (!patientProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Could not load profile data for this patient.</p>
        </CardContent>
      </Card>
    )
  }

  return (
     <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card>
        <CardHeader>
            <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <ProfileDetail icon={UserIcon} label="Full Name" value={`${patientProfile.firstName} ${patientProfile.lastName}`} />
            <ProfileDetail icon={Cake} label="Date of Birth" value={patientProfile.dateOfBirth?.toDate ? `${patientProfile.dateOfBirth.toDate().toLocaleDateString()} (${getAge(patientProfile.dateOfBirth)} years)` : 'Not Provided'} />
            <ProfileDetail icon={Users} label="Gender" value={patientProfile.gender} />
            <ProfileDetail icon={Droplet} label="Blood Group" value={patientProfile.bloodGroup} />
        </CardContent>
        </Card>

        <Card>
        <CardHeader>
            <CardTitle>Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
            <ProfileDetail icon={Phone} label="Phone Number" value={patientProfile.phoneNumber} />
            <ProfileDetail icon={AtSign} label="Email Address" value={patientProfile.email} />
            <ProfileDetail icon={Home} label="Full Address" value={patientProfile.address} />
            {patientProfile.emergencyContact?.name && (
                <div className="flex items-start gap-4">
                    <Users className="h-5 w-5 text-destructive mt-1 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                        <p className="font-semibold">{patientProfile.emergencyContact.name} ({patientProfile.emergencyContact.relation})</p>
                        <p className="text-sm font-semibold">{patientProfile.emergencyContact.phone}</p>
                    </div>
                </div>
            )}
        </CardContent>
        </Card>
    </div>
  )
}
