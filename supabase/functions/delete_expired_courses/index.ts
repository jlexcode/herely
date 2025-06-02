serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const now = new Date().toISOString();

  // Get expired courses
  const { data: expiredCourses, error: fetchError } = await supabase
    .from('courses')
    .select('id')
    .lt('delete_at', now);

  if (fetchError || !expiredCourses) {
    console.error("Error fetching courses:", fetchError);
    return new Response("Error fetching courses", { status: 500 });
  }

  // Delete files from storage
  for (const course of expiredCourses) {
    const folderPath = `${course.id}/`;  // assumes course.id is the folder name
  
    // List all files in the folder
    const { data: files, error: listError } = await supabase
      .storage
      .from('signatures')
      .list(folderPath, { limit: 1000 });
  
    if (listError) {
      console.warn(`Could not list files for course ${course.id}`, listError);
      continue; // move to next course
    }
  
    if (files.length > 0) {
      const filePaths = files.map(file => `${folderPath}${file.name}`);
  
      const { error: removeError } = await supabase
        .storage
        .from('signatures')
        .remove(filePaths);
  
      if (removeError) {
        console.warn(`Could not delete files for course ${course.id}`, removeError);
      }
    }
  }
  
  // Now delete courses
  const { error: deleteError } = await supabase
    .from('courses')
    .delete()
    .lt('delete_at', now);

  if (deleteError) {
    console.error("Deletion error:", deleteError);
    return new Response("Error deleting expired courses", { status: 500 });
  }

  return new Response("Expired courses and storage deleted", { status: 200 });
});