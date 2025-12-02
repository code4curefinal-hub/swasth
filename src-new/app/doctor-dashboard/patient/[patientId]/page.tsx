
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientProfileTab } from '@/components/doctor/patient-profile-tab';
import { MedicalHistoryTab } from '@/components/doctor/medical-history-tab';
import { PrescriptionsTab } from '@/components/doctor/prescriptions-tab';
import { LabReportsTab } from '@/components/doctor/lab-reports-tab';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PatientDetailPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const firestore = useFirestore();

  const patientDocRef = useMemoFirebase(() => {
    if (!patientId || !firestore) return null;
    return doc(firestore, 'users', patientId);
  }, [patientId, firestore]);

  const { data: patientProfile, isLoading } = useDoc(patientDocRef);

  const PatientHeaderSkeleton = () => (
    <div className="flex items-center gap-4">
      <Skeleton className="h-20 w-20 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
    </div>
  );

  return (
    <div className="bg-muted/40 min-h-screen">
      <div className="container mx-auto max-w-7xl px-6 py-12">
        <div className="space-y-8">
            <Button variant="ghost" asChild className="mb-4">
                <Link href="/doctor-dashboard">
                    <ArrowLeft className="mr-2 h-4 w-4"/>
                    Back to Patient List
                </Link>
            </Button>
          {isLoading ? (
            <PatientHeaderSkeleton />
          ) : patientProfile ? (
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary">
                <AvatarImage src={`https://picsum.photos/seed/${patientId}/200`} />
                <AvatarFallback className="text-2xl">
                  {patientProfile.firstName?.charAt(0)}
                  {patientProfile.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{patientProfile.firstName} {patientProfile.lastName}</h1>
                <p className="text-muted-foreground">{patientProfile.email}</p>
              </div>
            </div>
          ) : (
             <Card><CardHeader><CardTitle>Patient not found</CardTitle></CardHeader></Card>
          )}

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="history">Medical History</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="reports">Lab Reports</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-6">
                <PatientProfileTab patientId={patientId} patientProfile={patientProfile} isLoading={isLoading} />
            </TabsContent>
            <TabsContent value="history" className="mt-6">
                <MedicalHistoryTab patientId={patientId} />
            </TabsContent>
            <TabsContent value="prescriptions" className="mt-6">
                <PrescriptionsTab patientId={patientId} />
            </TabsContent>
            <TabsContent value="reports" className="mt-6">
                <LabReportsTab patientId={patientId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
