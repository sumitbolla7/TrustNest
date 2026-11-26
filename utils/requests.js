const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || null;

// Fetch all properties
async function fetchProperties({ showFeatured = false } = {}) {
  try {
    // Handle the case where the domain is not available yet
    if (!apiDomain) return showFeatured ? [] : { properties: [] };

    const res = await fetch(
      `${apiDomain}/properties${showFeatured ? '/featured' : ''}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }

    return res.json();
  } catch (error) {
    console.log(error);
    return showFeatured ? [] : { properties: [] };
  }
}

// Fetch single property
async function fetchProperty(id, edit = false) {
  try {
    // Handle the case where the domain is not available yet
    if (!apiDomain) {
      if (typeof window === 'undefined') return null;
    }

    const res = await fetch(`/api/properties/${id}${edit ? "?edit=1" : ""}`, { cache: "no-store" });

    if (!res.ok) {
      throw new Error('Failed to fetch data');
    }

    return res.json();
  } catch (error) {
    console.log(error);
    return null;
  }
}

export { fetchProperties, fetchProperty };
