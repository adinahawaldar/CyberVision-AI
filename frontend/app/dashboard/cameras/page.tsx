"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCameras } from '@/lib/data/cameras';
import { Camera } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter, 
  Grid2X2, 
  Columns, 
  Loader2,
  PlusCircle,
  Camera as CameraIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'groups'>('grid');
  const [filters, setFilters] = useState({
    showOffline: true,
    showAlerts: true,
    locations: [] as string[],
  });

  useEffect(() => {
    const fetchCameras = async () => {
      setLoading(true);
      try {
        const camerasData = await getCameras();
        setCameras(camerasData);
        // Extract unique locations for filters
        const uniqueLocations = Array.from(new Set(camerasData.map(c => c.location)));
        setFilters(prev => ({
          ...prev,
          locations: uniqueLocations,
        }));
      } catch (error) {
        console.error('Error fetching cameras:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCameras();
  }, []);

  // Apply filters and search
  const filteredCameras = cameras.filter(camera => {
    // Apply status filter
    if (!filters.showOffline && camera.status === 'offline') return false;
    
    // Apply alerts filter
    if (!filters.showAlerts && camera.alerts && camera.alerts.length > 0) return false;
    
    // Apply search
    if (searchQuery && !camera.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !camera.location.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const locationCounts = cameras.reduce((acc, camera) => {
    acc[camera.location] = (acc[camera.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cameras</h1>
          <p className="text-muted-foreground">
            View and manage all connected cameras.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative w-full md:w-auto flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search cameras..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" /> 
                Filters
                {(!filters.showOffline || !filters.showAlerts) && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                    {!filters.showOffline && !filters.showAlerts ? 2 : 1}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter Cameras</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filters.showOffline}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showOffline: checked }))}
              >
                Show offline cameras
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.showAlerts}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showAlerts: checked }))}
              >
                Show cameras with alerts
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex items-center border rounded-md">
            <Button 
              variant={view === 'grid' ? 'default' : 'ghost'} 
              size="sm" 
              className="h-9 rounded-r-none"
              onClick={() => setView('grid')}
            >
              <Grid2X2 className="h-4 w-4" />
            </Button>
            <Button 
              variant={view === 'groups' ? 'default' : 'ghost'} 
              size="sm" 
              className="h-9 rounded-l-none border-l"
              onClick={() => setView('groups')}
            >
              <Columns className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCameras.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-primary">
              <CameraIcon className="w-6 h-6 text-[#ff3538]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">No Cameras Found</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {cameras.length === 0
                  ? "You have not added any cameras yet. Connect a camera feed to start monitoring."
                  : "No cameras match your current search and filter settings."}
              </p>
            </div>
            {cameras.length === 0 && (
              <Button asChild className="rounded-full bg-[#ff3538] hover:bg-[#e62e31] text-white">
                <Link href="/dashboard/settings?tab=cameras">
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Add New Camera
                </Link>
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          {view === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCameras.map(camera => (
                <Card key={camera.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="truncate">{camera.name}</CardTitle>
                    <CardDescription>{camera.location}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-video bg-black rounded-md flex items-center justify-center overflow-hidden relative group">
                      {camera.status === 'online' ? (
                        <img 
                          src={`http://localhost:8000/api/v1/streaming/live/${camera.id}`} 
                          alt={camera.name}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Feed Offline</p>
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge variant={camera.status === 'online' ? 'default' : 'secondary'} className="h-5 text-xs">
                          {camera.status === 'online' ? 'LIVE' : 'OFFLINE'}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground font-mono">
                        {camera.model || 'Vision Cam'}
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a href={`/dashboard/cameras/live?id=${camera.id}`}>View Live</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {view === 'groups' && (
            <div className="space-y-6">
              {Object.keys(locationCounts).map(location => (
                <Card key={location}>
                  <CardHeader>
                    <CardTitle className="text-xl">{location}</CardTitle>
                    <CardDescription>{locationCounts[location]} cameras</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredCameras
                        .filter(camera => camera.location === location)
                        .map(camera => (
                          <div key={camera.id} className="border rounded-md p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{camera.name}</h3>
                                <Badge 
                                  variant={camera.status === 'online' ? 'default' : 'secondary'}
                                  className="mt-1"
                                >
                                  {camera.status}
                                </Badge>
                              </div>
                              <Button size="sm" variant="outline">View</Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}