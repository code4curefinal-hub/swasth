
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, PlusCircle, Trash2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser, deleteDocumentNonBlocking } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';

export function MedicalHistoryTab({ patientId }: { patientId: string }) {
    const { user: doctorUser } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [newHistoryItem, setNewHistoryItem] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const healthRecordsRef = useMemoFirebase(() => {
        if (!patientId || !firestore) return null;
        return collection(firestore, `users/${patientId}/healthRecords`);
    }, [patientId, firestore]);
    
    const { data: medicalHistory, isLoading } = useCollection(healthRecordsRef);

    const handleAddItem = async () => {
        if (!newHistoryItem.trim() || !healthRecordsRef || !doctorUser) return;
        
        setIsAdding(true);
        try {
            await addDoc(healthRecordsRef, {
                recordType: 'medicalHistory',
                details: newHistoryItem,
                dateCreated: serverTimestamp(),
                userId: patientId, // The patient's ID
                addedBy: doctorUser.uid, // The doctor's ID
            });
            setNewHistoryItem('');
            toast({
                title: "Success",
                description: "Medical history item added.",
            });
        } catch (error) {
            console.error("Error adding medical history:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not add medical history item.",
            });
        } finally {
            setIsAdding(false);
        }
    };
    
    const handleDeleteItem = (itemId: string) => {
        if (!healthRecordsRef) return;
        const itemDocRef = doc(healthRecordsRef, itemId);
        deleteDocumentNonBlocking(itemDocRef);
        toast({
            title: "Item Deleted",
            description: "The medical history item has been removed.",
        });
    };

    const SkeletonLoader = () => (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg border bg-background p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <History className="h-6 w-6" />
          <CardTitle className="text-2xl">Medical History</CardTitle>
        </div>
        <CardDescription>
          A summary of the patient's past and present medical conditions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-2">Add New Entry</h4>
          <div className="flex items-start gap-2">
            <Textarea 
              placeholder="e.g., Diagnosed with Type 2 Diabetes..."
              value={newHistoryItem}
              onChange={(e) => setNewHistoryItem(e.target.value)}
              className="flex-grow"
            />
            <Button onClick={handleAddItem} disabled={isAdding || !newHistoryItem.trim()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {isAdding ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
            <h4 className="font-medium">Recorded History</h4>
            {isLoading ? <SkeletonLoader /> : medicalHistory && medicalHistory.length > 0 ? (
            medicalHistory
                .filter(item => item.recordType === 'medicalHistory')
                .sort((a, b) => b.dateCreated?.toMillis() - a.dateCreated?.toMillis())
                .map((item) => (
                <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border bg-background p-4"
                >
                    <div>
                      <p>{item.details}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recorded on: {item.dateCreated ? new Date(item.dateCreated.seconds * 1000).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </Button>
                </div>
                ))
            ) : (
            !isLoading && <p className="text-muted-foreground text-center py-4">No medical history recorded for this patient yet.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
